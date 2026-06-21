import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { db } from "@/firebase/admin";


export async function POST(request: Request) {
  const { type, role, level, techstack,  userid, transcript } = await request.json();

  try {
    const defaultType = type || "General";
    const defaultRole = role || "Overall Health";
    const defaultLevel = level || "Medium";
    const defaultTechstack = techstack || "Wellness, Fitness";

    let extractedType = defaultType;
    let extractedRole = defaultRole;
    let extractedLevel = defaultLevel;
    let extractedTechstack = defaultTechstack;
    let generatedQuestions = [
      "How have you been feeling overall since your last checkup?",
      "Have you experienced any changes in your sleep patterns or energy levels?",
      "Can you describe your current appetite and general nutritional intake?",
      "Are you experiencing any physical discomfort or symptoms that concern you?",
      "How have you been managing your daily stress and mental well-being?"
    ];

    try {
      const formattedTranscript = (transcript && transcript.length > 0)
        ? transcript.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n")
        : "";

      const { text: resultText } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Analyze the following conversation between an AI Health Consultant and a patient. If the conversation is empty, use the default configuration provided below.

        Default Configuration (fallback):
        - Focus Area: ${defaultType}
        - Key Concern: ${defaultRole}
        - Priority Level: ${defaultLevel}
        - Health Tags: ${defaultTechstack}

        Extract or infer the following health checkup details:
        1. focusArea (e.g., Physical, Mental, Lifestyle, Cardiac, etc. Limit to 1-2 words)
        2. keyConcern (e.g., Stress, Sleep, Nutrition, Back pain, etc. Limit to 1-2 words)
        3. priorityLevel (Low, Medium, or High)
        4. healthTags (Comma-separated symptoms or related tags, e.g., Insomnia, fatigue. Limit to 3 tags)

        Based on these details, generate a list of 5 important and relevant questions to better understand the patient’s condition for their next checkup. The questions will be asked by a voice assistant, so avoid using "/" or "*" or any characters that may disrupt voice rendering.

        Conversation Transcript:
        ${formattedTranscript || "No conversation transcript available."}

        Return the result strictly as a JSON object with the following keys:
        {
          "focusArea": "string",
          "keyConcern": "string",
          "priorityLevel": "string",
          "healthTags": "string",
          "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
        }
        Do not return any markdown formatting or extra text.
        `,
      });

      try {
        const cleanJSON = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanJSON);
        extractedType = data.focusArea || extractedType;
        extractedRole = data.keyConcern || extractedRole;
        extractedLevel = data.priorityLevel || extractedLevel;
        extractedTechstack = data.healthTags || extractedTechstack;
        if (data.questions && data.questions.length > 0) {
          generatedQuestions = data.questions;
        }
      } catch (e) {
        console.error("Error parsing JSON:", e);
      }
    } catch (geminiError) {
      console.error("Gemini API call failed, using default/fallback wellness questions:", geminiError);
    }

    const techstackArray = typeof extractedTechstack === "string"
      ? extractedTechstack.split(",").map((s: string) => s.trim())
      : Array.isArray(extractedTechstack)
        ? extractedTechstack
        : ["Wellness"];

    const interview = {
      role: extractedRole,
      type: extractedType,
      level: extractedLevel,
      techstack: techstackArray,
      questions: generatedQuestions,
      userId: userid,
      finalized: true,
      coverImage: generateRandomAvatarURL(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}


const generateRandomAvatarURL = () => {
  const seed = Math.random().toString();
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
};
