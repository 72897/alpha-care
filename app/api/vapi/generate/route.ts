import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { db } from "@/firebase/admin";


export async function POST(request: Request) {
  const { type, role, level, techstack,  userid } = await request.json();

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `You are a virtual health consultant for the AlphaCare app.
      Please generate a personalized health checkup questionnaire.
      The checkup focus is: ${type} (e.g., Physical, Mental, Lifestyle).
      The key concern or focus area is: ${role} (e.g., Heart, Stress, Sleep, Nutrition).
      The urgency or priority level is: ${level} (e.g., Low, Medium, High).
      The related symptoms or health tags are: ${techstack}.

      Kindly create a list of 5 important and relevant questions to better understand the patient’s condition.
      The questions will be asked by a voice assistant, so avoid using "/" or "*" or any characters that may disrupt voice rendering.
      Return the questions formatted exactly like this:
      ["Question 1", "Question 2", "Question 3"]

      Thank you for helping make healthcare more accessible. 💙
`,
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: JSON.parse(questions),
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
