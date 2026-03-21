import httpx
from app.core.config import settings

DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # ElevenLabs Rachel


async def synthesize_speech(text: str, voice_id: str = "") -> bytes | None:
    if not settings.ELEVENLABS_API_KEY:
        return None

    vid = (
        voice_id
        if voice_id and voice_id not in ("", "default")
        else DEFAULT_VOICE_ID
    )
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{vid}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }

    async with httpx.AsyncClient(timeout=30) as http_client:
        try:
            response = await http_client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                return response.content
        except Exception as e:
            print(f"TTS error: {e}")
    return None
