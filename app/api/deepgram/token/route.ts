import { DeepgramClient } from "@deepgram/sdk";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "DEEPGRAM_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const deepgram = new DeepgramClient({ apiKey });
    const response = await deepgram.auth.v1.tokens.grant({
      ttl_seconds: 300,
    });

    return Response.json(
      { token: response.access_token },
      { status: 200 }
    );
  } catch (error) {
    console.error("Deepgram token error:", error);
    return Response.json(
      { error: "Failed to generate Deepgram token" },
      { status: 500 }
    );
  }
}
