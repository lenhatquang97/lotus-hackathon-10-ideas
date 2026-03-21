import logging
import os
import uuid

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.db import list_topics, get_topic
from app.manager import RoomManager
from app.room import Room
from app.stt_service import transcribe_audio, transcribe_audio_bytes

logger = logging.getLogger(__name__)


class JoinTopicRequest(BaseModel):
    topic_id: str


def create_router(room_manager: RoomManager) -> APIRouter:
    router = APIRouter()

    # ---- Topics (from MongoDB) ----

    @router.get("/api/topics")
    async def api_list_topics():
        topics = await list_topics()
        return [
            {
                "id": t["id"],
                "title": t.get("title", ""),
                "description": t.get("description", ""),
                "domain_knowledge": t.get("domain_knowledge", ""),
                "tags": t.get("tags", []),
                "cefr_levels": t.get("cefr_levels", []),
                "characters": [
                    {
                        "name": c.get("name", ""),
                        "role": c.get("role", ""),
                        "persona": c.get("persona", ""),
                        "bias_perception": c.get("bias_perception", ""),
                    }
                    for c in t.get("characters", [])
                ],
                "play_count": t.get("play_count", 0),
            }
            for t in topics
        ]

    @router.get("/api/topics/{topic_id}")
    async def api_get_topic(topic_id: str):
        topic = await get_topic(topic_id)
        if not topic:
            return {"error": "Topic not found"}
        return topic

    # ---- Rooms ----

    @router.post("/api/rooms/join-topic")
    async def join_topic(req: JoinTopicRequest):
        """Create a room from a topic (or return existing one)."""
        topic_doc = await get_topic(req.topic_id)
        if not topic_doc:
            return {"error": "Topic not found"}
        room = room_manager.create_room_from_topic(topic_doc)
        return {
            "room_id": room.room_id,
            "topic": room.topic,
            "agents": [a.name for a in room.agents],
        }

    @router.get("/api/rooms")
    async def api_list_rooms():
        return room_manager.list_rooms()

    # ---- TTS Proxy (Google Cloud Text-to-Speech) ----

    @router.post("/api/tts")
    async def tts_proxy(request: Request):
        """Proxy TTS requests to Google Cloud TTS API for TalkingHead lip-sync."""
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

    # ---- STT Proxy (ElevenLabs Speech-to-Text) ----

    @router.post("/api/stt")
    async def stt_proxy(file: UploadFile = File(...)):
        """Proxy STT requests to ElevenLabs API.

        FE posts audio file, gets transcribed text back immediately.
        This is faster than sending base64 audio through WebSocket.
        """
        audio_bytes = await file.read()
        content_type = file.content_type or "audio/webm"

        text = await transcribe_audio_bytes(audio_bytes, content_type)
        if text is None:
            return JSONResponse(
                {"error": "Transcription failed"},
                status_code=500,
            )

        return {"text": text}

    # ---- HTTP Speak endpoint ----

    @router.post("/api/speak")
    async def api_speak(payload: dict):
        """HTTP endpoint to trigger speech in a room.

        Body: {"topic_id": "...", "name": "...", "text": "..."}
        """
        topic_id = payload.get("topic_id", "")
        name = payload.get("name", "").lower()
        text = payload.get("text", "")

        room_id = f"topic-{topic_id}"
        room = room_manager.get_room(room_id)
        if not room:
            return {
                "status": "error",
                "message": f"Room not found for topic {topic_id}",
            }

        if not text:
            return {"status": "error", "message": "Text is required"}

        await room.send_speak_to_world(name, text)
        return {"status": "done", "name": name}

    # ---- WebSocket: Virtual Room FE (world) ----

    @router.websocket("/ws/room/{topic_id}")
    async def websocket_world(ws: WebSocket, topic_id: str):
        """WebSocket endpoint for the virtual room FE.

        This creates/joins a room for the topic and controls avatar speech.

        Receives from FE:
          - {"type": "speak_done", "name": "..."} — avatar finished speaking
          - {"type": "user_audio", "data": "<base64>"} — user voice input
          - {"type": "user_message", "text": "..."} — user text input

        Sends to FE:
          - {"type": "speak", "name": "...", "text": "..."} — make avatar speak
          - {"type": "waiting_for_user", "speaker": "..."} — waiting for user input
        """
        await ws.accept()
        logger.info(f"World WS connected for topic: {topic_id}")

        # Create or get room for this topic
        topic_doc = await get_topic(topic_id)
        if not topic_doc:
            await ws.send_json({"type": "error", "message": "Topic not found"})
            await ws.close()
            return

        room = room_manager.create_room_from_topic(topic_doc)

        # Register this WS as the world connection
        room.set_world_connection(ws.send_json)

        # Start the conversation
        await room.add_world_user()

        try:
            while True:
                data = await ws.receive_json()
                msg_type = data.get("type")

                if msg_type == "speak_done":
                    room.handle_speak_done()

                elif msg_type == "user_audio":
                    # Transcribe audio via ElevenLabs STT
                    audio_data = data.get("data", "")
                    if audio_data:
                        text = await transcribe_audio(audio_data)
                        if text:
                            logger.info(f"[World:{topic_id}] User said: {text}")
                            await room.handle_user_message("User", text)
                            # Echo transcription back to FE for display
                            await ws.send_json(
                                {
                                    "type": "user_transcription",
                                    "text": text,
                                }
                            )

                elif msg_type == "user_message":
                    text = data.get("text", "").strip()
                    if text:
                        await room.handle_user_message("User", text)

        except WebSocketDisconnect:
            logger.info(f"World WS disconnected for topic: {topic_id}")
            room.remove_world_connection()
        except Exception as e:
            logger.error(f"World WS error for topic {topic_id}: {e}", exc_info=True)
            room.remove_world_connection()

    # ---- WebSocket: Chat UI (original) ----

    @router.websocket("/ws")
    async def websocket_endpoint(ws: WebSocket):
        await ws.accept()
        username: str | None = None
        room: Room | None = None

        try:
            while True:
                data = await ws.receive_json()
                msg_type = data.get("type")

                if msg_type == "join":
                    room_id = data.get("room_id", "")
                    username = data.get("username", f"user-{uuid.uuid4().hex[:6]}")
                    room = room_manager.get_room(room_id)
                    if not room:
                        await ws.send_json(
                            {"type": "error", "content": f"Room '{room_id}' not found"}
                        )
                        continue
                    await room.add_user(username, ws.send_json)

                elif msg_type == "message" and room and username:
                    content = data.get("content", "").strip()
                    if content:
                        await room.handle_user_message(username, content)

                elif msg_type == "leave":
                    if room and username:
                        await room.remove_user(username)
                        room = None

        except WebSocketDisconnect:
            if room and username:
                await room.remove_user(username)
        except Exception:
            if room and username:
                await room.remove_user(username)

    return router
