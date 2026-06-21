"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { getCurrentUser } from "./auth.action";

//get all interview by searchind for userid
export const getInterviewsByUserId = async (): Promise<Interview[]> => {
  const user = await getCurrentUser();

  if (!user) {
    console.log("❌ No authenticated user");
    return [];
  }

  try {
    // 1. Get interviews created by user
    const createdInterviewsSnapshot = await db
      .collection("interviews")
      .where("userId", "==", user.id)
      .get();

    const interviewsMap = new Map<string, Interview>();
    createdInterviewsSnapshot.docs.forEach((doc) => {
      interviewsMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      } as Interview);
    });

    // 2. Get interviews completed by user (having feedback)
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", user.id)
      .get();

    const pendingInterviewIds = new Set<string>();
    feedbackSnapshot.docs.forEach((doc) => {
      const interviewId = doc.data().interviewId;
      if (interviewId && !interviewsMap.has(interviewId)) {
        pendingInterviewIds.add(interviewId);
      }
    });

    // Fetch the external templates that the user has completed
    if (pendingInterviewIds.size > 0) {
      const idsArray = Array.from(pendingInterviewIds);
      const chunks = [];
      for (let i = 0; i < idsArray.length; i += 30) {
        chunks.push(idsArray.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const extSnapshot = await db
          .collection("interviews")
          .where("__name__", "in", chunk)
          .get();

        extSnapshot.docs.forEach((doc) => {
          interviewsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          } as Interview);
        });
      }
    }

    // Convert map to array and sort by createdAt descending
    const combined = Array.from(interviewsMap.values());
    combined.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return combined;
  } catch (error) {
    console.error("Error in getInterviewsByUserId:", error);
    return [];
  }
};

//get lastest interview function
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

//fetch interview details
export async function getInterviewsById(id: string): Promise<Interview | null> {
  const interviews = await db.collection("interviews").doc(id).get();

  return interviews.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment,
      },
    } = await generateObject({
      model: google("gemini-2.5-flash", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI health consultant analyzing a virtual health checkup conducted via AlphaCare. Your task is to evaluate the patient's wellness using structured health categories. Be thorough and precise in your evaluation. Do not be overly lenient—highlight any concerns or areas that need attention.

      Transcript:
      ${formattedTranscript}

      Please assess the patient on a scale from 0 to 100 in the following wellness areas. Do not add or remove categories:

      - **Sleep Quality**: Duration, consistency, and restfulness.
      - **Nutritional Balance**: Diet diversity, timing, and nutrient intake.
      - **Stress & Mental Wellness**: Emotional stability, stress triggers, coping ability.
      - **Physical Activity**: Frequency, duration, and type of physical exercises.
      - **Vital Signs & Body Metrics**: General health indicators like weight, BP, etc.

      Also, include:
      - Strengths: Highlight areas where the patient is doing well.
      - Areas for Improvement: Mention habits or patterns that should be addressed.
      - Final Assessment: Give a brief conclusion and suggest general health advice, precautions, and if necessary, mild over-the-counter medications.
      - Use a friendly and professional tone, as if you are a healthcare consultant.
      - Be sure to be professional and polite.
      - Keep all your responses short and simple. Use official language, but be kind and welcoming.
      - This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.

        `,
      system:
        "You are a professional AI consultant doctor analyzing a Health checkup. Your task is to evaluate the candidate based on structured categories and give recommended precautions and medicines. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.",
    });

    const feedback = await db.collection("feedback").add({
      interviewId,
      userId,
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      feedbackId: feedback.id,
    };
  } catch (error) {
    console.log("Error Saving Feedback", error);

    return {
      success: false,
    };
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const feedback = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (feedback.empty) return null;
  const feedbackDoc = feedback.docs[0];
  return {
    id: feedbackDoc.id,
    ...feedbackDoc.data(),
  } as Feedback;
}

// Get User Wellness Stats
export async function getUserWellnessStats() {
  const user = await getCurrentUser();
  if (!user) return { avgScore: 0, count: 0 };

  try {
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", user.id)
      .get();

    let totalScore = 0;
    feedbackSnapshot.forEach((doc) => {
      totalScore += doc.data().totalScore || 0;
    });

    const count = feedbackSnapshot.size;
    return {
      avgScore: count > 0 ? Math.round(totalScore / count) : 0,
      count,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { avgScore: 0, count: 0 };
  }
}

// Get User's Latest Feedback Report
export async function getLatestUserFeedback(): Promise<Feedback | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", user.id)
      .get();

    if (feedbackSnapshot.empty) return null;
    const feedbacks = feedbackSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
    
    feedbacks.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return feedbacks[0] as Feedback;
  } catch (error) {
    console.error("Error fetching latest feedback:", error);
    return null;
  }
}

// Get User's Full Feedback History
export async function getUserFeedbackHistory(): Promise<Feedback[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", user.id)
      .get();

    const feedbacks = feedbackSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[];

    // Sort by createdAt ascending (chronological order)
    feedbacks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return feedbacks;
  } catch (error) {
    console.error("Error in getUserFeedbackHistory:", error);
    return [];
  }
}
