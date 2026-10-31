import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { getCurrentUser } from "@/lib/session";
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

    // Both reads are independent of each other, so overlap them rather than
    // waiting for the interviews before starting on the feedback.
    const [interviewsSnapshot, feedbackSnapshot] = await Promise.all([
      db.collection("interviews").where("userId", "==", user.id).get(),
      db.collection("feedback").where("userId", "==", user.id).get(),
    ]);

    const interviews = interviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];

    const interviewById = new Map(interviews.map((i) => [i.id, i]));

    const feedbacks = (
      feedbackSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Feedback[]
    )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 10);

    // Categories are chosen per checkup now, so list whatever the report
    // actually contains instead of probing for a fixed set of names.
    const feedbackSummary = feedbacks
      .map((f, index) => {
        const match = f.interviewId
          ? interviewById.get(f.interviewId)
          : undefined;
        const focusName = match ? `${match.role} (${match.type})` : "General";
        const categories =
          f.categoryScores
            ?.map((c) => `- ${c.name}: ${c.score}/100 — ${c.comment}`)
            .join("\n") || "- No category breakdown recorded";

        return `Checkup #${index + 1} - ${focusName} on ${new Date(
          f.createdAt
        ).toLocaleDateString()}:
- Total Score: ${f.totalScore}/100
${categories}
- Strengths: ${f.strengths?.join(", ") || "None mentioned"}
- Areas for Improvement: ${f.areasForImprovement?.join(", ") || "None mentioned"}
- Final Assessment: ${f.finalAssessment}
`;
      })
      .join("\n\n");

    const systemInstruction = `You are Buddhimaan AI, a warm, professional, and knowledgeable health companion for the user, ${user.name}.
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
