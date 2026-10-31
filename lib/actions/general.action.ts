"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/session";

/**
 * Every checkup the user owns or has completed, plus the feedback for each, in
 * one pass. Callers get the feedback map back so they don't have to re-query it
 * per card.
 */
export const getUserCheckups = async (): Promise<{
  interviews: Interview[];
  feedbackByInterviewId: Record<string, Feedback>;
}> => {
  const user = await getCurrentUser();

  if (!user) {
    console.log("❌ No authenticated user");
    return { interviews: [], feedbackByInterviewId: {} };
  }

  try {
    // The two independent queries overlap rather than running back to back.
    const [createdInterviewsSnapshot, feedbackByInterviewId] =
      await Promise.all([
        db.collection("interviews").where("userId", "==", user.id).get(),
        getFeedbackMapByUserId(user.id),
      ]);

    const interviewsMap = new Map<string, Interview>();
    createdInterviewsSnapshot.docs.forEach((doc) => {
      interviewsMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      } as Interview);
    });

    // Checkups the user completed from someone else's template won't be in the
    // query above, so pull those in by id.
    const pendingInterviewIds = new Set<string>();
    Object.keys(feedbackByInterviewId).forEach((interviewId) => {
      if (!interviewsMap.has(interviewId)) {
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

      // Chunks are independent, so fire them together instead of awaiting each.
      const extSnapshots = await Promise.all(
        chunks.map((chunk) =>
          db.collection("interviews").where("__name__", "in", chunk).get()
        )
      );

      extSnapshots.forEach((extSnapshot) => {
        extSnapshot.docs.forEach((doc) => {
          interviewsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          } as Interview);
        });
      });
    }

    // Convert map to array and sort by createdAt descending
    const interviews = Array.from(interviewsMap.values());
    interviews.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return { interviews, feedbackByInterviewId };
  } catch (error) {
    console.error("Error in getUserCheckups:", error);
    return { interviews: [], feedbackByInterviewId: {} };
  }
};

/**
 * Checkup templates from other users.
 *
 * The `userId != ...` filter is applied in memory. Firestore requires the first
 * orderBy to be on the inequality field, so combining `!=` with
 * `orderBy("createdAt")` needs a composite index and fails without one — an
 * uncaught rejection that took the whole dashboard render down with it.
 */
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  try {
    const interviews = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .orderBy("createdAt", "desc")
      // Over-fetch a little so filtering the caller's own out still leaves a
      // full page.
      .limit(limit * 2)
      .get();

    return interviews.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Interview)
      .filter((interview) => interview.userId !== userId)
      .slice(0, limit);
  } catch (error) {
    console.error("Error in getLatestInterviews:", error);
    return [];
  }
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
        Write up the following Buddhimaan AI checkup as a report for the user.

      Transcript:
      ${formattedTranscript}

      Choose the categories yourself, based on what THIS checkup actually covered. Pick between three and five, name them in your own words, and score each from 0 to 100 where higher is healthier.

      A checkup usually centres on one concern, so break that concern down instead of padding the report with unrelated wellness topics. Depending on the transcript, useful categories might be things like Symptom Severity, Symptom Pattern & Triggers, Impact on Daily Life, Duration & Progression, Existing Conditions & Medication, Sleep Quality, Nutritional Balance, Stress & Mental Wellness, or Physical Activity. Treat those as examples, not a checklist.

      Category rules:
      - Only include a category the conversation genuinely covered.
      - Never write that something "was not covered in this checkup". If it was not covered, leave it out.
      - Ground every score and comment in what the transcript says. Never invent symptoms, habits, or measurements.
      - Score honestly: a severe, worsening, or daily-life-limiting symptom scores low; a mild or well-managed one scores high.

      Also include:
      - Strengths: what the user is doing well or what is reassuring in what they described. If there is genuinely nothing, return an empty list rather than inventing one.
      - Areas for Improvement: specific, actionable things worth addressing, drawn from the transcript.
      - Final Assessment: a short paragraph covering what the user described, the most likely explanation for it, what they should do next, and the warning signs that mean they should be seen in person or urgently.

      Style rules:
      - You may state the most likely explanation for the user's symptoms and give practical next steps, framed as a likely explanation from a voice consultation rather than a confirmed diagnosis.
      - Do NOT name prescription medication or give doses. General measures are fine: rest, hydration, heat or ice, sleep, diet changes, or seeing a GP or specialist in person.
      - Never refer to a doctor or receptionist by name.
      - Address the user directly as "you". Do not call them a patient or a candidate.
      - This is a written report, not speech. Keep it clear, kind, and concise.

        `,
      system:
        "You write up Buddhimaan AI health checkup transcripts as structured reports. Derive the report's categories from what the conversation actually covered rather than a fixed list, and never pad it with categories the transcript did not touch. You may give the most likely explanation for the user's symptoms and concrete next steps, but never name prescription medication or doses, and make clear an in-person examination is what confirms things. Ground every score and comment in the transcript, and be honest about concerns rather than lenient.",
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

/**
 * Every feedback doc the user has, keyed by interviewId. One query for the whole
 * page instead of one per card.
 */
export async function getFeedbackMapByUserId(
  userId: string
): Promise<Record<string, Feedback>> {
  try {
    const snapshot = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .get();

    const map: Record<string, Feedback> = {};
    snapshot.docs.forEach((doc) => {
      const feedback = { id: doc.id, ...doc.data() } as Feedback;
      const existing = map[feedback.interviewId];
      // Keep the newest if a checkup was retaken.
      if (
        !existing ||
        new Date(feedback.createdAt || 0).getTime() >
          new Date(existing.createdAt || 0).getTime()
      ) {
        map[feedback.interviewId] = feedback;
      }
    });

    return map;
  } catch (error) {
    console.error("Error loading feedback map:", error);
    return {};
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

/**
 * Everything the profile page needs, from one session check and one Firestore
 * read. Fetching these as separate actions meant verifying the session cookie
 * and re-running the same feedback query once per action, and Next.js
 * serialises server actions, so the round trips stacked up rather than
 * overlapping.
 */
export async function getProfilePageData(): Promise<{
  user: User | null;
  stats: { avgScore: number; count: number };
  latestReport: Feedback | null;
  history: Feedback[];
}> {
  const empty = {
    user: null,
    stats: { avgScore: 0, count: 0 },
    latestReport: null,
    history: [],
  };

  const user = await getCurrentUser();
  if (!user) return empty;

  try {
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", user.id)
      .get();

    // Sorted in memory rather than with orderBy so this stays a single-field
    // query and needs no composite index.
    const history = feedbackSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Feedback)
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );

    const count = history.length;
    const totalScore = history.reduce(
      (sum, item) => sum + (item.totalScore || 0),
      0
    );

    return {
      user,
      stats: {
        avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        count,
      },
      // history is ascending, so the newest report is last.
      latestReport: count > 0 ? history[count - 1] : null,
      history,
    };
  } catch (error) {
    console.error("Error loading profile data:", error);
    return { ...empty, user };
  }
}

