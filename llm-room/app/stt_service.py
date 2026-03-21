import base64
import logging
import os
import httpx

logger = logging.getLogger(__name__)


async def transcribe_audio_bytes(audio_bytes: bytes, content_type: str = "audio/webm") -> str | None:
    """Transcribe raw audio bytes using ElevenLabs Speech-to-Text API.

    Args:
        audio_bytes: Raw audio data (webm/opus from browser MediaRecorder)
        content_type: MIME type of the audio

    Returns:
        Transcribed text or None on failure.
    """
    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key:
        logger.error("ELEVENLABS_API_KEY not configured")
        return None

    ext = "webm" if "webm" in content_type else "wav"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/speech-to-text",
                headers={
                    "xi-api-key": api_key,
                },
                files={
                    "file": (f"audio.{ext}", audio_bytes, content_type),
                },
                data={
                    "model_id": "scribe_v1",
                    "language_code": "en",
                },
            )

        if response.status_code != 200:
            logger.error(f"ElevenLabs STT error: {response.status_code} {response.text}")
            return None

        result = response.json()
        text = result.get("text", "").strip()
        logger.info(f"STT transcription: {text[:80]}{'...' if len(text)>80 else ''}")
        return text if text else None

    except Exception as e:
        logger.error(f"STT transcription failed: {e}")
        return None


async def transcribe_audio(audio_base64: str) -> str | None:
    """Transcribe base64-encoded audio using ElevenLabs STT."""
    audio_bytes = base64.b64decode(audio_base64)
    return await transcribe_audio_bytes(audio_bytes)
