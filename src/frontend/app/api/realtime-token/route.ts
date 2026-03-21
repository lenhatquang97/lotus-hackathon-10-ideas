import { NextResponse } from "next/server";

/**
 * POST /api/realtime-token
 *
 * Mints an ephemeral token from the OpenAI Realtime API.
 * Session config (transcription-only) is baked into the token.
 * Token is valid for ~1 minute.
 */
export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "transcription",
            audio: {
              input: {
                transcription: {
                  model: "gpt-4o-mini-transcribe",
                  language: "en",
                },
                noise_reduction: {
                  type: "near_field",
                },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 700,
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI token error:", response.status, errText);
      return NextResponse.json(
        { error: `OpenAI error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      token: data.value,
      expires_at: data.expires_at,
    });
  } catch (err) {
    console.error("Token endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
