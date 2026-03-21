import os
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from app.rooms import room_manager
from app.core.config import settings

router = APIRouter()


@router.post("/scribe-token")
async def get_scribe_token():
    """Generate a single-use token for ElevenLabs Scribe realtime STT.
    This keeps the API key server-side only."""
    if not settings.ELEVENLABS_API_KEY:
        return JSONResponse(
            {"error": "ELEVENLABS_API_KEY not configured"}, status_code=500
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
            headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
        )

    if response.status_code != 200:
        return JSONResponse(
            {"error": "Failed to get scribe token"}, status_code=response.status_code
        )

    data = response.json()
    return {"token": data.get("token", "")}


@router.websocket("/ws/room/{topic_id}")
async def websocket_room(ws: WebSocket, topic_id: str):
    """WebSocket endpoint for the virtual room frontend, scoped by topic.

    Receives:
      - {"type": "speak_done", "name": "..."} — acknowledgment after avatar finishes speaking

    Sends:
      - {"type": "speak", "name": "...", "text": "..."} — command for avatar to speak
    """
    await room_manager.connect(ws, topic_id)
    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "speak_done":
                room = room_manager.get_room(topic_id)
                if room:
                    room.handle_ack()
            elif msg_type == "barge_in":
                room = room_manager.get_room(topic_id)
                if room:
                    room.handle_barge_in()

    except WebSocketDisconnect:
        room_manager.disconnect(topic_id)


@router.websocket("/ws/room")
async def websocket_room_default(ws: WebSocket):
    """WebSocket endpoint for the virtual room frontend (no topic)."""
    await room_manager.connect(ws, "__default__")
    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "speak_done":
                room = room_manager.get_room("__default__")
                if room:
                    room.handle_ack()
            elif msg_type == "barge_in":
                room = room_manager.get_room("__default__")
                if room:
                    room.handle_barge_in()

    except WebSocketDisconnect:
        room_manager.disconnect("__default__")


@router.post("/speak")
async def api_speak(payload: dict):
    """HTTP endpoint to trigger speech in the virtual room.

    Body: {"name": "alice" | "john", "text": "Hello!", "topic_id": "..."}
    Blocks until the avatar finishes speaking, then returns acknowledgment.
    """
    name = payload.get("name", "").lower()
    text = payload.get("text", "")
    topic_id = payload.get("topic_id", "__default__")

    if name not in ("alice", "john"):
        return {"status": "error", "message": f"Unknown character: {name}"}
    if not text:
        return {"status": "error", "message": "Text is required"}

    result = await room_manager.speak(topic_id, name, text)
    return result


@router.post("/tts")
async def tts_proxy(request: Request):
    """Proxy TTS requests to Google Cloud Text-to-Speech API.

    This hides the API key from the frontend.
    """
    # api_key = os.environ.get("GOOGLE_TTS_API_KEY", "")
    api_key = "AIzaSyAq6mRH9PWwchbcE6LZHbF8ZqbC8PS5WQg"

    if not api_key:
        return JSONResponse(
            {"error": "GOOGLE_TTS_API_KEY not configured"},
            status_code=500,
        )

    body = await request.json()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://texttospeech.googleapis.com/v1beta1/text:synthesize?key={api_key}",
            json=body,
            headers={"Content-Type": "application/json"},
        )

    if response.status_code != 200:
        return JSONResponse(response.json(), status_code=response.status_code)

    return JSONResponse(response.json())
