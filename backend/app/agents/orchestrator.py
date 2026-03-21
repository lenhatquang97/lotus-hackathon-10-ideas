import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional
from fastapi import WebSocket

from app.agents.agent import ConversationAgent
from app.evaluator.engine import EvaluationEngine
from app.db.repositories import session_repo, topic_repo
from app.services.stt_service import transcribe_audio
from app.services.tts_service import synthesize_speech


class ConversationOrchestrator:
    def __init__(self, session_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.websocket = websocket
        self.agents: list[ConversationAgent] = []
        self.conversation_history: list[dict] = []
        self.evaluator = EvaluationEngine()
        self.session_data: Optional[dict] = None
        self.topic_data: Optional[dict] = None
        self.silence_task: Optional[asyncio.Task] = None
        self.audio_buffer: bytes = b""
        self.is_active = False
        self.is_interrupted = False
        self.response_task: Optional[asyncio.Task] = None
        self.live_scores = {"tone": 0.5, "content": 0.5, "first_voice": 0.5}
        self.turn_count = 0

    async def initialize(self):
        self.session_data = await session_repo.get_session_by_id(self.session_id)
        if not self.session_data:
            await self.send_event({"type": "error", "message": "Session not found"})
            return

        topic_id = self.session_data["topic_id"]
        self.topic_data = await topic_repo.get_topic_by_id(str(topic_id))
        if not self.topic_data:
            await self.send_event({"type": "error", "message": "Topic not found"})
            return

        learner_cefr = "B2"
        for character in self.topic_data.get("characters", []):
            agent = ConversationAgent(character, self.topic_data, learner_cefr)
            self.agents.append(agent)

        await session_repo.start_session(self.session_id)
        self.is_active = True
        await self.send_event({"type": "session_state", "status": "active"})
        self._reset_silence_timer()

    async def handle_event(self, event: dict):
        event_type = event.get("type")
        if event_type == "start_session":
            await self.initialize()
        elif event_type == "end_session":
            await self.end_session()
        elif event_type == "barge_in":
            await self.handle_barge_in()
        elif event_type == "mic_active":
            if not event.get("active") and self.audio_buffer:
                await self.process_audio_buffer()

    async def handle_barge_in(self):
        """User started speaking while agent was talking - cancel agent response."""
        self.is_interrupted = True
        # Cancel any in-progress response generation
        if self.response_task and not self.response_task.done():
            self.response_task.cancel()
            self.response_task = None
        # Signal speech end to frontend
        await self.send_event({"type": "character_speech_end", "text": "[interrupted]"})
        self._reset_silence_timer()
        print(f"[Barge-in] User interrupted agent in session {self.session_id}")

    async def handle_audio_chunk(self, chunk: bytes):
        if self.is_active:
            self.audio_buffer += chunk
            self._reset_silence_timer()

    async def process_audio_buffer(self):
        if not self.audio_buffer or len(self.audio_buffer) < 500:
            self.audio_buffer = b""
            return

        audio_data = self.audio_buffer
        self.audio_buffer = b""

        text = await transcribe_audio(audio_data)
        if not text or not text.strip():
            return

        self.turn_count += 1
        turn_id = str(uuid.uuid4())
        timestamp = datetime.utcnow()

        self.conversation_history.append({"role": "user", "content": text})
        if len(self.conversation_history) > 40:
            self.conversation_history = self.conversation_history[-40:]

        learner_turn = {
            "turn_id": turn_id,
            "speaker": "learner",
            "character_id": None,
            "character_name": None,
            "text": text,
            "timestamp": timestamp,
            "evaluation_snapshot": {
                "tone_score": 0.0,
                "content_score": 0.0,
                "first_voice_score": 0.0,
            },
        }
        await session_repo.add_transcript_turn(self.session_id, learner_turn)
        await self.send_event(
            {
                "type": "transcript_update",
                "turn": {**learner_turn, "timestamp": timestamp.isoformat()},
            }
        )

        self.live_scores = await self.evaluator.score_turn(
            text, self.conversation_history, self.live_scores
        )
        await self.send_event({"type": "live_scores", **self.live_scores})

        if not self.agents:
            return

        self.is_interrupted = False
        self.response_task = asyncio.current_task()

        try:
            agent = self._select_responding_agent()
            character = agent.character
            char_id = str(character.get("id", character.get("_id", "")))

            response_text = await agent.generate_response(self.conversation_history)

            # Check if user interrupted during generation
            if self.is_interrupted:
                self.response_task = None
                return

            self.conversation_history.append(
                {
                    "role": "assistant",
                    "content": f"[{character['name']}]: {response_text}",
                }
            )

            await self.send_event(
                {
                    "type": "character_speech_start",
                    "character_id": char_id,
                    "character_name": character["name"],
                }
            )

            audio_bytes = await synthesize_speech(
                response_text, character.get("voice_id", "")
            )

            # Check again before sending audio
            if self.is_interrupted:
                await self.send_event({"type": "character_speech_end", "text": ""})
                self.response_task = None
                return

            if audio_bytes:
                await self.websocket.send_bytes(audio_bytes)

            char_turn_id = str(uuid.uuid4())
            char_timestamp = datetime.utcnow()
            char_turn = {
                "turn_id": char_turn_id,
                "speaker": "character",
                "character_id": char_id,
                "character_name": character["name"],
                "text": response_text,
                "timestamp": char_timestamp,
                "evaluation_snapshot": {
                    "tone_score": 0.0,
                    "content_score": 0.0,
                    "first_voice_score": 0.0,
                },
            }
            await session_repo.add_transcript_turn(self.session_id, char_turn)
            await self.send_event(
                {"type": "character_speech_end", "text": response_text}
            )
            await self.send_event(
                {
                    "type": "transcript_update",
                    "turn": {
                        **char_turn,
                        "timestamp": char_timestamp.isoformat(),
                    },
                }
            )
        except asyncio.CancelledError:
            # Barge-in cancelled this task
            print(f"[Barge-in] Response generation cancelled in session {self.session_id}")
        finally:
            self.response_task = None

        self._reset_silence_timer()

    def _select_responding_agent(self) -> ConversationAgent:
        idx = self.turn_count % len(self.agents)
        return self.agents[idx]

    def _reset_silence_timer(self):
        if self.silence_task and not self.silence_task.done():
            self.silence_task.cancel()
        if self.is_active:
            self.silence_task = asyncio.create_task(self._silence_detector())

    async def _silence_detector(self):
        try:
            await asyncio.sleep(6)
            await self.send_event({"type": "silence_warning", "seconds": 6})
            await asyncio.sleep(4)
            if self.agents and self.is_active:
                agent = self.agents[0]
                character = agent.character
                prompt_history = self.conversation_history + [
                    {
                        "role": "user",
                        "content": "[The learner has been silent. Gently re-engage them with a question related to the topic.]",
                    }
                ]
                response_text = await agent.generate_response(prompt_history)
                char_id = str(character.get("id", ""))

                await self.send_event(
                    {
                        "type": "character_speech_start",
                        "character_id": char_id,
                        "character_name": character["name"],
                    }
                )
                audio_bytes = await synthesize_speech(
                    response_text, character.get("voice_id", "")
                )
                if audio_bytes:
                    await self.websocket.send_bytes(audio_bytes)
                await self.send_event(
                    {"type": "character_speech_end", "text": response_text}
                )

                char_turn = {
                    "turn_id": str(uuid.uuid4()),
                    "speaker": "character",
                    "character_id": char_id,
                    "character_name": character["name"],
                    "text": response_text,
                    "timestamp": datetime.utcnow(),
                    "evaluation_snapshot": {
                        "tone_score": 0.0,
                        "content_score": 0.0,
                        "first_voice_score": 0.0,
                    },
                }
                await session_repo.add_transcript_turn(self.session_id, char_turn)
                await self.send_event(
                    {
                        "type": "transcript_update",
                        "turn": {
                            **char_turn,
                            "timestamp": char_turn["timestamp"].isoformat(),
                        },
                    }
                )
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Silence detector error: {e}")

    async def end_session(self):
        self.is_active = False
        if self.silence_task and not self.silence_task.done():
            self.silence_task.cancel()

        session = await session_repo.get_session_by_id(self.session_id)
        transcript = session.get("transcript", []) if session else []
        evaluation = await self.evaluator.compute_final_evaluation(
            transcript, self.topic_data or {}
        )

        await session_repo.complete_session(self.session_id, evaluation)
        await self.send_event({"type": "session_state", "status": "completed"})

    async def send_event(self, event: dict):
        try:
            await self.websocket.send_text(json.dumps(event, default=str))
        except Exception:
            pass

    async def cleanup(self):
        self.is_active = False
        if self.silence_task and not self.silence_task.done():
            self.silence_task.cancel()
