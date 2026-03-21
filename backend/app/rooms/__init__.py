import asyncio
from fastapi import WebSocket, WebSocketDisconnect


class RoomConnection:
    """Manages a single frontend WebSocket connection to a virtual room."""

    def __init__(self, ws: WebSocket, topic_id: str):
        self.ws = ws
        self.topic_id = topic_id
        self._ack_event: asyncio.Event | None = None

    async def send_speak(self, name: str, text: str) -> dict:
        """Send a speak command and wait for the frontend to acknowledge completion."""
        self._ack_event = asyncio.Event()
        await self.ws.send_json({"type": "speak", "name": name, "text": text})
        await self._ack_event.wait()
        self._ack_event = None
        return {"status": "done", "name": name}

    def handle_ack(self):
        """Called when the frontend sends a speak_done acknowledgment."""
        if self._ack_event:
            self._ack_event.set()

    def handle_barge_in(self):
        """Called when the user starts speaking while an avatar is talking.
        Unblocks any pending speak wait so the conversation can continue."""
        if self._ack_event:
            self._ack_event.set()
        print(f"[Barge-in] User interrupted avatar in room {self.topic_id}")


class RoomManager:
    """Manages virtual room connections keyed by topic_id."""

    def __init__(self):
        self.rooms: dict[str, RoomConnection] = {}

    async def connect(self, ws: WebSocket, topic_id: str):
        await ws.accept()
        self.rooms[topic_id] = RoomConnection(ws, topic_id)

    def disconnect(self, topic_id: str):
        self.rooms.pop(topic_id, None)

    def get_room(self, topic_id: str) -> RoomConnection | None:
        return self.rooms.get(topic_id)

    async def speak(self, topic_id: str, name: str, text: str) -> dict:
        room = self.rooms.get(topic_id)
        if not room:
            return {"status": "error", "message": f"No frontend connected for topic {topic_id}"}
        return await room.send_speak(name, text)


room_manager = RoomManager()
