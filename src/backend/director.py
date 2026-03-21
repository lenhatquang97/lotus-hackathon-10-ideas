"""Director — async state machine that orchestrates the conversation."""

import argparse
import asyncio
import logging
import sys

from .content_loader import ContentLoader
from .context_manager import ContextManager
from .engagement import (
    generate_engagement_schedule,
    select_engagement_question,
    should_trigger_engagement,
)
from .llm_client import LLMClient
from .models import SessionState, Turn

logger = logging.getLogger(__name__)

PACING_DELAY = 2.0  # seconds between turns


def decide_responder(session: SessionState, learner_text: str) -> str:
    """Decide which agent responds to a learner interruption."""
    text_lower = learner_text.lower()
    persona_a_name = session.script.persona_a.name.lower()
    persona_b_name = session.script.persona_b.name.lower()

    if persona_a_name in text_lower:
        return "persona_a"
    if persona_b_name in text_lower:
        return "persona_b"

    return session.current_speaker


class Director:
    def __init__(
        self,
        script_id: str,
        content_loader: ContentLoader,
        llm_client: LLMClient,
        enable_engagement: bool = True,
    ):
        self.script_id = script_id
        self.loader = content_loader
        self.llm = llm_client
        self.ctx = ContextManager(llm_client)
        self.enable_engagement = enable_engagement
        self.session: SessionState | None = None

        # Callback for sending messages (set by WebSocket handler)
        self.on_turn: asyncio.Future | None = None
        self._user_input_queue: asyncio.Queue | None = None

    def create_session(self) -> SessionState:
        """Initialize a new conversation session."""
        script = self.loader.load_script(self.script_id)
        session = SessionState(
            script=script,
            current_speaker=script.opening_speaker,
        )
        if self.enable_engagement:
            session.engagement_schedule = generate_engagement_schedule(script)
            logger.info(f"Engagement schedule: {session.engagement_schedule}")
        self.session = session
        return session

    async def should_advance_phase(self, session: SessionState) -> bool:
        """Check if the conversation should move to the next phase."""
        phase = session.script.phases[session.current_phase]

        if session.phase_turn_count < phase.min_turns:
            return False

        if session.phase_turn_count >= phase.max_turns:
            return True

        # Soft check every 3 turns after min
        if (
            session.phase_turn_count >= phase.min_turns
            and session.phase_turn_count % 3 == 0
        ):
            return await self.ctx.check_phase_coverage(session)

        return False

    def _alternate_speaker(self, session: SessionState) -> None:
        """Switch to the other speaker."""
        if session.current_speaker == "persona_a":
            session.current_speaker = "persona_b"
        else:
            session.current_speaker = "persona_a"

    def _get_speaker_name(self, session: SessionState) -> str:
        if session.current_speaker == "persona_a":
            return session.script.persona_a.name
        return session.script.persona_b.name

    def _get_speaker_id(self, session: SessionState) -> str:
        """Get the persona ID (e.g. 'john', 'alice') for the current speaker."""
        if session.current_speaker == "persona_a":
            return session.script.persona_a.id
        return session.script.persona_b.id

    async def execute_turn(
        self,
        session: SessionState,
        engagement_template: str | None = None,
        learner_text: str | None = None,
    ) -> Turn:
        """Execute one agent turn."""
        system_prompt = self.ctx.build_system_prompt(session)
        user_message = self.ctx.build_user_message(
            session,
            engagement_template=engagement_template,
            learner_text=learner_text,
        )

        response_text, usage = await self.llm.generate_response(
            system_prompt=system_prompt,
            user_message=user_message,
        )

        turn = Turn(
            speaker=session.current_speaker,
            speaker_name=self._get_speaker_name(session),
            text=response_text,
            phase=session.current_phase,
            turn_number=session.turn_number,
            is_engagement=engagement_template is not None,
        )

        return turn

    async def run_conversation(
        self,
        send_message=None,
        user_input_queue: asyncio.Queue | None = None,
    ) -> list[Turn]:
        """
        Run the full conversation loop.

        send_message: async callable(dict) to send messages to client
        user_input_queue: asyncio.Queue for receiving user input
        """
        session = self.session
        if not session:
            session = self.create_session()

        self._user_input_queue = user_input_queue

        if send_message:
            await send_message(
                {
                    "type": "session_started",
                    "script_id": session.script.id,
                    "title": session.script.title,
                    "personas": [
                        session.script.persona_a.name,
                        session.script.persona_b.name,
                    ],
                }
            )

        while session.current_phase < len(session.script.phases):
            # Check for user input (non-blocking)
            user_input = await self._check_user_input()
            if user_input:
                if user_input.get("action") == "end":
                    break
                if user_input.get("action") == "speak":
                    await self._handle_learner_interruption(
                        session, user_input["text"], send_message
                    )
                    continue

            # Check engagement trigger
            engagement_template = None
            if self.enable_engagement and should_trigger_engagement(session):
                engagement_template = select_engagement_question(session)

            # Execute agent turn
            turn = await self.execute_turn(
                session,
                engagement_template=engagement_template,
            )

            # Record turn
            session.conversation_log.append(turn)
            session.turn_number += 1
            session.phase_turn_count += 1

            # Send to client
            if send_message:
                msg_type = "engagement" if turn.is_engagement else "agent_turn"
                msg = {
                    "type": msg_type,
                    "speaker": self._get_speaker_id(session),
                    "speaker_name": turn.speaker_name,
                    "text": turn.text,
                }
                if turn.is_engagement:
                    msg["awaiting_response"] = True
                await send_message(msg)

            # If engagement, wait for learner response
            if turn.is_engagement:
                session.awaiting_learner = True
                learner_response = await self._wait_for_learner()
                session.awaiting_learner = False
                if learner_response:
                    # Record learner turn
                    learner_turn = Turn(
                        speaker="learner",
                        speaker_name="Learner",
                        text=learner_response,
                        phase=session.current_phase,
                        turn_number=session.turn_number,
                    )
                    session.conversation_log.append(learner_turn)
                    session.turn_number += 1

                    # Agent responds to learner then continues
                    response_turn = await self.execute_turn(
                        session, learner_text=learner_response
                    )
                    session.conversation_log.append(response_turn)
                    session.turn_number += 1
                    session.phase_turn_count += 1

                    if send_message:
                        await send_message(
                            {
                                "type": "agent_turn",
                                "speaker": self._get_speaker_id(session),
                                "speaker_name": response_turn.speaker_name,
                                "text": response_turn.text,
                            }
                        )

            # Update summary if needed
            await self.ctx.maybe_update_summary(session)

            # Phase transition check
            if await self.should_advance_phase(session):
                session.current_phase += 1
                session.phase_turn_count = 0
                if session.current_phase < len(session.script.phases):
                    new_phase = session.script.phases[session.current_phase]
                    logger.info(
                        f"Phase transition → {session.current_phase + 1}: {new_phase.name}"
                    )
                    if send_message:
                        await send_message(
                            {
                                "type": "phase_change",
                                "phase": session.current_phase + 1,
                                "phase_name": new_phase.name,
                            }
                        )

            # Alternate speakers
            if not session.awaiting_learner:
                self._alternate_speaker(session)

            # Pacing delay
            await asyncio.sleep(PACING_DELAY)

        if send_message:
            await send_message({"type": "session_ended", "reason": "completed"})

        logger.info(f"Conversation ended. Total turns: {session.turn_number}")
        logger.info(f"Token usage: {self.llm.get_total_usage()}")

        return session.conversation_log

    async def _check_user_input(self) -> dict | None:
        """Non-blocking check for user input from the queue."""
        if not self._user_input_queue:
            return None
        try:
            return self._user_input_queue.get_nowait()
        except asyncio.QueueEmpty:
            return None

    async def _wait_for_learner(self, timeout: float = 30.0) -> str | None:
        """Wait for learner response with timeout."""
        if not self._user_input_queue:
            return None
        try:
            msg = await asyncio.wait_for(
                self._user_input_queue.get(), timeout=timeout
            )
            if msg.get("action") == "speak":
                return msg["text"]
        except asyncio.TimeoutError:
            logger.info("Learner response timeout — continuing conversation")
        return None

    async def _handle_learner_interruption(
        self, session: SessionState, text: str, send_message=None
    ) -> None:
        """Handle a learner interrupting the conversation."""
        # Record learner turn
        learner_turn = Turn(
            speaker="learner",
            speaker_name="Learner",
            text=text,
            phase=session.current_phase,
            turn_number=session.turn_number,
        )
        session.conversation_log.append(learner_turn)
        session.turn_number += 1

        # Decide who responds
        responder = decide_responder(session, text)
        old_speaker = session.current_speaker
        session.current_speaker = responder

        # Generate response to learner
        turn = await self.execute_turn(session, learner_text=text)
        session.conversation_log.append(turn)
        session.turn_number += 1
        session.phase_turn_count += 1

        if send_message:
            await send_message(
                {
                    "type": "agent_turn",
                    "speaker": self._get_speaker_id(session),
                    "speaker_name": turn.speaker_name,
                    "text": turn.text,
                }
            )

        # Restore speaker alternation
        session.current_speaker = old_speaker
        self._alternate_speaker(session)


# ── Terminal runner for vibe testing ──


async def run_terminal_conversation(script_id: str):
    """Run a conversation in the terminal for vibe testing."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    loader = ContentLoader()
    llm = LLMClient()
    director = Director(
        script_id=script_id,
        content_loader=loader,
        llm_client=llm,
        enable_engagement=False,  # No engagement in basic vibe test
    )
    director.create_session()

    session = director.session
    print(f"\n{'='*60}")
    print(f"  {session.script.title}")
    print(f"  {session.script.persona_a.name} vs {session.script.persona_b.name}")
    print(f"{'='*60}\n")

    async def print_message(msg: dict):
        if msg["type"] == "agent_turn":
            print(f"\n[{msg['speaker_name']}]: {msg['text']}")
        elif msg["type"] == "phase_change":
            print(f"\n{'─'*40}")
            print(f"  ▸ Phase {msg['phase']}: {msg['phase_name']}")
            print(f"{'─'*40}")
        elif msg["type"] == "session_started":
            print("Conversation started.\n")
        elif msg["type"] == "session_ended":
            print(f"\n{'='*60}")
            print("  Conversation ended.")
            print(f"{'='*60}")

    await director.run_conversation(send_message=print_message)

    usage = llm.get_total_usage()
    print(f"\nToken usage: {usage}")


def main():
    parser = argparse.ArgumentParser(description="Run a conversation in terminal")
    parser.add_argument("--script", required=True, help="Script ID to run")
    args = parser.parse_args()
    asyncio.run(run_terminal_conversation(args.script))


if __name__ == "__main__":
    main()
