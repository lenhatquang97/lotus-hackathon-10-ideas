import asyncio
import logging
import time
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from typing import Any

from app.agent import Agent
from app.models import Message, ScriptEntry
from app.script import ScriptGenerator

logger = logging.getLogger(__name__)

# Type alias for the async send callback
SendFn = Callable[[dict], Coroutine[Any, Any, None]]

# Return value from _play_script
PLAY_COMPLETED = "completed"       # script finished naturally
PLAY_DISCONNECTED = "disconnected" # no connections left


@dataclass
class PlayStoppedAt:
    """Script stopped at an index — either user question or user interruption."""
    index: int
    reason: str  # "user_question" | "user_interrupted"


class Room:
    def __init__(self, room_id: str, agents: list[Agent], topic: str = ""):
        self.room_id = room_id
        self.agents = agents
        self.topic = topic
        self.connections: dict[str, SendFn] = {}  # username -> async send function
        self.history: list[Message] = []

        # World (virtual room FE) connection — sends speak commands, waits for ack
        self._world_send: SendFn | None = None
        self._world_connected = False
        self._speak_ack_event: asyncio.Event = asyncio.Event()

        # Script playback state
        self._script_gen = ScriptGenerator()
        self._script_task: asyncio.Task | None = None
        self._waiting_for_user = False
        self._user_responded = asyncio.Event()
        self._script_interrupted = False  # set when user speaks mid-script
        self._message_batch_delay = 1.5   # seconds to wait for more messages

        # Seed conversation
        if topic:
            content = f"Welcome! Today's topic: {topic}"
        else:
            content = "Welcome to the chat room! The conversation is open."
        self.history.append(Message(sender="System", content=content, sender_type="system"))
        logger.info(f"[Room:{room_id}] Created | topic={topic!r} agents={[a.name for a in agents]}")

    @property
    def user_count(self) -> int:
        return len(self.connections)

    @property
    def usernames(self) -> list[str]:
        return list(self.connections.keys())

    @property
    def has_world(self) -> bool:
        return self._world_connected

    # ---- World (virtual room FE) connection ----

    def set_world_connection(self, send_fn: SendFn):
        """Register the virtual room FE WebSocket as the world connection."""
        self._world_send = send_fn
        self._world_connected = True
        logger.info(f"[Room:{self.room_id}] World FE connected")

    def remove_world_connection(self):
        """Remove the virtual room FE WebSocket."""
        self._world_send = None
        self._world_connected = False
        # Unblock any pending ack wait
        self._speak_ack_event.set()
        logger.info(f"[Room:{self.room_id}] World FE disconnected")

    def handle_speak_done(self):
        """Called when the virtual room FE sends speak_done acknowledgment."""
        self._speak_ack_event.set()

    async def send_speak_to_world(self, name: str, text: str):
        """Send a speak command to the virtual room FE and wait for ack."""
        if not self._world_send or not self._world_connected:
            logger.warning(f"[Room:{self.room_id}] No world connection — skipping speak")
            return

        self._speak_ack_event.clear()
        try:
            await self._world_send({"type": "speak", "name": name, "text": text})
            logger.debug(f"[Room:{self.room_id}] Sent speak to world: {name} -> {text[:60]}")
            # Wait for ack with timeout
            await asyncio.wait_for(self._speak_ack_event.wait(), timeout=60.0)
            logger.debug(f"[Room:{self.room_id}] Speak ack received from world: {name}")
        except asyncio.TimeoutError:
            logger.warning(f"[Room:{self.room_id}] Speak ack timeout for {name}")
        except Exception as e:
            logger.error(f"[Room:{self.room_id}] Error sending speak to world: {e}")

    # ---- Script / chat control ----

    def start_auto_chat(self):
        if self._script_task is None or self._script_task.done():
            logger.info(f"[Room:{self.room_id}] Starting script playback")
            self._script_task = asyncio.create_task(self._script_playback())

    def stop_auto_chat(self):
        if self._script_task and not self._script_task.done():
            logger.info(f"[Room:{self.room_id}] Stopping script playback")
            self._script_task.cancel()

    async def add_user(self, username: str, send_fn: SendFn):
        self.connections[username] = send_fn
        logger.info(f"[Room:{self.room_id}] User joined: {username} | total_users={len(self.connections)}")
        history_data = [m.to_dict() for m in self.history]
        await send_fn({"type": "history", "messages": history_data})
        await self._broadcast_room_info()
        sys_msg = Message(sender="System", content=f"{username} joined the room", sender_type="system")
        self.history.append(sys_msg)
        await self.broadcast(sys_msg.to_dict())
        if self.agents:
            self.start_auto_chat()

    async def add_world_user(self):
        """Called when the virtual room FE connects — starts the conversation."""
        logger.info(f"[Room:{self.room_id}] World user connected — starting conversation")
        if self.agents and (self._script_task is None or self._script_task.done()):
            self.start_auto_chat()

    async def remove_user(self, username: str):
        self.connections.pop(username, None)
        logger.info(f"[Room:{self.room_id}] User left: {username} | total_users={len(self.connections)}")
        sys_msg = Message(sender="System", content=f"{username} left the room", sender_type="system")
        self.history.append(sys_msg)
        await self.broadcast(sys_msg.to_dict())
        await self._broadcast_room_info()
        if not self.connections and not self._world_connected:
            self.stop_auto_chat()
        if self._waiting_for_user and not self.connections and not self._world_connected:
            self._user_responded.set()

    async def handle_user_message(self, username: str, text: str):
        logger.info(f"[Room:{self.room_id}] User message from {username}: {text[:80]}{'...' if len(text)>80 else ''}")
        user_msg = Message(sender=username, content=text, sender_type="user")
        self.history.append(user_msg)
        await self.broadcast(user_msg.to_dict())

        # Interrupt running script OR signal user-question wait
        if self._waiting_for_user:
            logger.info(f"[Room:{self.room_id}] User responded to question — resuming script")
            self._user_responded.set()
        else:
            # User spoke mid-script — interrupt it
            self._script_interrupted = True
            logger.info(f"[Room:{self.room_id}] User spoke mid-script — interrupting")

    async def broadcast(self, data: dict):
        disconnected = []
        for username, send_fn in self.connections.items():
            try:
                await send_fn(data)
            except Exception:
                disconnected.append(username)
        for u in disconnected:
            logger.warning(f"[Room:{self.room_id}] Disconnected user removed: {u}")
            self.connections.pop(u, None)

    async def _broadcast_room_info(self):
        await self.broadcast({
            "type": "room_info",
            "agents": [a.name for a in self.agents],
            "users": self.usernames,
            "topic": self.topic,
        })

    def _script_to_dict(self, script: list[ScriptEntry]) -> list[dict]:
        return [
            {
                "speaker": e.speaker,
                "content": e.content,
                "delay": e.delay,
                "is_user_question": e.is_user_question,
            }
            for e in script
        ]

    async def _agents_react_to_user(self):
        """Each agent generates a live response reacting to the user's latest message(s)."""
        for agent in self.agents:
            if not self.connections and not self._world_connected:
                break
            logger.info(f"[Room:{self.room_id}] {agent.name} reacting to user...")
            await self.broadcast({"type": "typing", "sender": agent.name})
            response = await agent.respond(self.history)
            agent_msg = Message(
                sender=agent.name,
                content=response,
                sender_type="agent",
            )
            self.history.append(agent_msg)
            await self.broadcast(agent_msg.to_dict())

            # Send to world for avatar speech
            await self.send_speak_to_world(agent.name.lower(), response)

            logger.debug(
                f"[Room:{self.room_id}] {agent.name} reaction: {response[:80]}"
            )

    async def _wait_for_batch(self):
        """Wait briefly for the user to finish sending multiple messages."""
        logger.debug(f"[Room:{self.room_id}] Waiting {self._message_batch_delay}s for more messages...")
        await asyncio.sleep(self._message_batch_delay)
        while True:
            count_before = len(self.history)
            await asyncio.sleep(0.5)
            count_after = len(self.history)
            if count_after == count_before:
                break
            logger.debug(f"[Room:{self.room_id}] More messages arrived, waiting again...")
        logger.debug(f"[Room:{self.room_id}] Message batch complete")

    async def _play_script(self, script: list[ScriptEntry]) -> str | PlayStoppedAt:
        """Play a script — send speak commands to the world and wait for ack."""
        self._script_interrupted = False

        for idx, entry in enumerate(script):
            if not self.connections and not self._world_connected:
                return PLAY_DISCONNECTED

            if self._script_interrupted:
                logger.info(f"[Room:{self.room_id}] Script interrupted before entry #{idx+1}/{len(script)}")
                return PlayStoppedAt(index=idx, reason="user_interrupted")

            # Small delay between entries (reduced since avatar speech provides natural pacing)
            await asyncio.sleep(min(entry.delay, 2.0))

            if not self.connections and not self._world_connected:
                return PLAY_DISCONNECTED
            if self._script_interrupted:
                return PlayStoppedAt(index=idx, reason="user_interrupted")

            # Broadcast message to chat UI connections
            await self.broadcast({"type": "typing", "sender": entry.speaker})
            await asyncio.sleep(0.5)

            if not self.connections and not self._world_connected:
                return PLAY_DISCONNECTED
            if self._script_interrupted:
                return PlayStoppedAt(index=idx, reason="user_interrupted")

            # Deliver the message
            agent_msg = Message(
                sender=entry.speaker,
                content=entry.content,
                sender_type="agent",
            )
            self.history.append(agent_msg)
            await self.broadcast(agent_msg.to_dict())

            # Send to virtual room FE and wait for avatar to finish speaking
            await self.send_speak_to_world(entry.speaker.lower(), entry.content)

            marker = " [USER Q]" if entry.is_user_question else ""
            logger.debug(
                f"[Room:{self.room_id}] Played #{idx+1}/{len(script)} "
                f"{entry.speaker}{marker}: {entry.content[:60]}"
            )

            # If user question, pause and wait
            if entry.is_user_question and (self.connections or self._world_connected):
                logger.info(
                    f"[Room:{self.room_id}] Waiting for user response at entry #{idx+1}/{len(script)}..."
                )
                self._waiting_for_user = True
                self._user_responded.clear()
                await self.broadcast({"type": "waiting_for_user", "speaker": entry.speaker})
                # Also notify world
                if self._world_send and self._world_connected:
                    try:
                        await self._world_send({"type": "waiting_for_user", "speaker": entry.speaker})
                    except Exception:
                        pass
                await self._user_responded.wait()
                self._waiting_for_user = False

                await self._wait_for_batch()

                logger.info(f"[Room:{self.room_id}] Generating agent reactions to user answer...")
                await self._agents_react_to_user()

                return PlayStoppedAt(index=idx, reason="user_question")

        return PLAY_COMPLETED

    async def _script_playback(self):
        """Generate a script and play it. After user interaction, regenerate the rest."""
        try:
            await asyncio.sleep(3)

            if not self.connections and not self._world_connected:
                return
            if not self.agents:
                return

            total_entries = 10
            remaining = total_entries

            while remaining > 0 and (self.connections or self._world_connected):
                logger.info(
                    f"[Room:{self.room_id}] === Generating script ({remaining} entries) ==="
                )
                await self.broadcast({"type": "script_status", "status": "generating"})

                script = await self._script_gen.generate_script(
                    agents=self.agents,
                    topic=self.topic,
                    history=self.history,
                    usernames=self.usernames or ["User"],
                    num_entries=remaining,
                )

                await self.broadcast({
                    "type": "script",
                    "entries": self._script_to_dict(script),
                })
                logger.info(
                    f"[Room:{self.room_id}] Script ({len(script)} entries) generated"
                )

                result = await self._play_script(script)

                if result == PLAY_COMPLETED:
                    break
                elif result == PLAY_DISCONNECTED:
                    break
                elif isinstance(result, PlayStoppedAt):
                    played_count = result.index + 1 if result.reason == "user_question" else result.index
                    remaining = len(script) - played_count

                    if result.reason == "user_interrupted":
                        logger.info(
                            f"[Room:{self.room_id}] User interrupted at entry #{result.index+1}/{len(script)}"
                        )
                        await self._wait_for_batch()
                        self._script_interrupted = False

                        logger.info(f"[Room:{self.room_id}] Generating agent reactions to user interruption...")
                        await self._agents_react_to_user()

                    if remaining <= 0:
                        break
                    logger.info(
                        f"[Room:{self.room_id}] Regenerating {remaining} remaining entries"
                    )

            logger.info(f"[Room:{self.room_id}] === Script playback complete ===")
            await self.broadcast({"type": "script_status", "status": "finished"})

        except asyncio.CancelledError:
            logger.info(f"[Room:{self.room_id}] Script playback cancelled")
        except Exception as e:
            logger.error(f"[Room:{self.room_id}] Script playback error: {e}", exc_info=True)
