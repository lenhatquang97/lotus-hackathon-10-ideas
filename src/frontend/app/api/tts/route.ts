import { NextResponse } from "next/server";

const GOOGLE_TTS_URL =
  "https://texttospeech.googleapis.com/v1beta1/text:synthesize";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_TTS_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Forward the request to Google Cloud TTS
    const response = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Google TTS error:", data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("TTS proxy error:", err);
    return NextResponse.json(
      { error: "TTS proxy failed" },
      { status: 500 }
    );
  }
}
