import io
from openai import AsyncOpenAI
from app.core.config import settings

_client = None


def get_openai_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def transcribe_audio(audio_bytes: bytes) -> str:
    if len(audio_bytes) < 1000:
        return ""
    try:
        client = get_openai_client()
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.webm"
        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
        )
        return transcript.text
    except Exception as e:
        print(f"STT error: {e}")
        return ""
