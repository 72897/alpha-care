import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = (await request.json()) as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    };

    // Fetch user's checkups and feedbacks from Firestore to build context
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("userId", "==", user.id)
      .get();

    const interviews = interviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];

    interviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const slicedInterviews = interviews.slice(0, 10);

    // Fetch feedbacks
    let feedbackSummary = "";
    if (slicedInterviews.length > 0) {
      const feedbackSnapshot = await db
        .collection("feedback")
        .where("userId", "==", user.id)
        .get();

      const feedbacks = feedbackSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Feedback[];

      feedbacks.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const slicedFeedbacks = feedbacks.slice(0, 10);

      feedbackSummary = slicedFeedbacks
        .map((f, index) => {
          const matchInt = slicedInterviews.find((i) => i.id === f.interviewId);
          const focusName = matchInt ? `${matchInt.role} (${matchInt.type})` : "General";
          return `Checkup #${index + 1} - ${focusName} on ${new Date(f.createdAt).toLocaleDateString()}:
- Total Score: ${f.totalScore}/100
- Sleep Quality: ${f.categoryScores?.find((c) => c.name === "Sleep Quality")?.score || "N/A"}/100
- Nutritional Balance: ${f.categoryScores?.find((c) => c.name === "Nutritional Balance")?.score || "N/A"}/100
- Stress & Mental Wellness: ${f.categoryScores?.find((c) => c.name === "Stress & Mental Wellness")?.score || "N/A"}/100
- Physical Activity: ${f.categoryScores?.find((c) => c.name === "Physical Activity")?.score || "N/A"}/100
- Vital Signs: ${f.categoryScores?.find((c) => c.name === "Vital Signs & Body Metrics")?.score || "N/A"}/100
- Strengths: ${f.strengths?.join(", ") || "None mentioned"}
- Areas for Improvement: ${f.areasForImprovement?.join(", ") || "None mentioned"}
- Doctor's Final Assessment: ${f.finalAssessment}
`;
        })
        .join("\n\n");
    }

    const systemInstruction = `You are AlphaCare AI, a warm, professional, and knowledgeable health companion for the user, ${user.name}.
    Your goal is to help them understand their health history, guide them through wellness tips, and discuss their checkup results.
    
    Here is the patient's recent checkup and feedback history:
    ${feedbackSummary || "No checkups recorded yet. Offer to help them book their first checkup!"}

    Guidelines:
    - Keep your responses extremely short, concise, and direct (at most 2-3 sentences or a quick bulleted list). Avoid long explanations.
    - Use the checkup history to answer questions about their scores, sleep, diet, stress levels, strengths, or improvements.
    - Be warm, welcoming, and encouraging, like a supportive doctor.
    - If they ask for medical diagnoses or present severe symptoms, remind them politely that you are an AI companion and they should consult a real doctor (and they can book an appointment with a real doctor on the homepage).
    - Format response in clean Markdown.
    `;

    // Map client messages to Gemini content format
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await generateText({
        model: google("gemini-2.5-flash"),
        system: systemInstruction,
        messages: formattedMessages,
      });

      return Response.json({ text: response.text });
    } catch (geminiError) {
      console.error("Gemini API call failed in chat:", geminiError);
      return Response.json({ 
        text: "I am having trouble connecting to my cognitive system right now (Gemini rate-limited). However, I've successfully saved all your checkup files. Please ask me again in a moment, or view your history log!" 
      });
    }
  } catch (error) {
    console.error("Error in chat route:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
