"""Three-layer prompt assembly and context window management."""

import logging

from .llm_client import LLMClient, DEFAULT_MODEL_CHEAP
from .models import SessionState, PhasePersonaConfig

logger = logging.getLogger(__name__)

SYSTEM_PREAMBLE = """You are {name}, {role}. You are in a live conversation. Everything below defines who you are — your personality, beliefs, speech patterns, and emotional range. Stay in character at all times. Never break character. Never narrate actions. Speak only dialogue — as if you are actually talking in a room.

"""

SCENE_DIRECTIVE_TEMPLATE = """SCENE DIRECTIVE
═══════════════
Topic: {title}
Scene: {description}
Phase {current_phase} of {total_phases}: "{phase_name}"

YOUR EMOTIONAL ARC FOR THIS PHASE:
{arc}

TERRITORY TO EXPLORE:
{territory}

DIRECTION:
{instruction}

TONE/STYLE REFERENCE (use as inspiration, do NOT recite):
"{tone_example}"

YOUR COUNTERPART:
{counterpart_briefing}

{learner_context}"""

TURN_INSTRUCTION = """---
It is your turn, {name}. Stay in character.
Respond with 2-4 sentences maximum. Do not narrate actions.
Speak only dialogue."""

LEARNER_INTERRUPTION = """The Learner just said: "{learner_text}"
Respond to the Learner briefly (1-2 sentences) in character, then continue the conversation with {other_name}.
"""

ENGAGEMENT_INSTRUCTION = """Instead of continuing the conversation, turn to the Learner and ask them a question.
Use this as inspiration (rephrase naturally): "{template}"
Ask one question only, then wait for their response."""

SUMMARY_SYSTEM = "You are a conversation summarizer. Be extremely concise."

SUMMARY_USER = """Summarize the key points of this conversation in 2-3 sentences.
Focus on: what arguments were made, what positions were taken,
and where the emotional tone shifted.

{turns}"""

SLIDING_WINDOW_SIZE = 8
SUMMARIZE_EVERY = 10


class ContextManager:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    def _get_persona_config(
        self, session: SessionState
    ) -> tuple:
        """Get the current speaker's persona data and phase config."""
        script = session.script
        phase = script.phases[session.current_phase]

        if session.current_speaker == "persona_a":
            persona = script.persona_a
            other_persona = script.persona_b
            phase_config = phase.persona_a
        else:
            persona = script.persona_b
            other_persona = script.persona_a
            phase_config = phase.persona_b

        return persona, other_persona, phase_config, phase

    def _extract_name_role(self, persona) -> tuple[str, str]:
        """Extract role from the Identity section of the soul document."""
        role = "Unknown"
        for line in persona.soul_document.split('\n'):
            if '**Role:**' in line:
                role = line.split('**Role:**')[1].strip()
                break
        return persona.name, role

    def build_system_prompt(self, session: SessionState) -> str:
        """Build the cached system prompt (Layer 1) for the current speaker."""
        persona, _, _, _ = self._get_persona_config(session)
        name, role = self._extract_name_role(persona)
        return SYSTEM_PREAMBLE.format(name=name, role=role) + persona.soul_document

    def build_user_message(
        self,
        session: SessionState,
        engagement_template: str | None = None,
        learner_text: str | None = None,
    ) -> str:
        """Build the user message (Layer 2 + Layer 3) for the current speaker."""
        persona, other_persona, phase_config, phase = self._get_persona_config(session)

        # Layer 2: Scene directive
        territory_list = "\n".join(f"- {t}" for t in phase_config.territory)

        scene = SCENE_DIRECTIVE_TEMPLATE.format(
            title=session.script.title,
            description=session.script.description,
            current_phase=session.current_phase + 1,
            total_phases=len(session.script.phases),
            phase_name=phase.name,
            arc=phase_config.arc,
            territory=territory_list,
            instruction=phase_config.instruction,
            tone_example=phase_config.tone_example,
            counterpart_briefing=other_persona.counterpart_briefing,
            learner_context=session.script.learner_context,
        )

        # Optional: learner interruption
        if learner_text:
            scene += "\n\n" + LEARNER_INTERRUPTION.format(
                learner_text=learner_text,
                other_name=other_persona.name,
            )

        # Layer 3: Conversation history
        history = self._build_history(session)

        # Turn instruction or engagement instruction
        if engagement_template:
            instruction = ENGAGEMENT_INSTRUCTION.format(template=engagement_template)
        else:
            instruction = TURN_INSTRUCTION.format(name=persona.name)

        return scene + "\n\n" + history + "\n" + instruction

    def _build_history(self, session: SessionState) -> str:
        """Build the conversation history with sliding window."""
        log = session.conversation_log
        if not log:
            return "CONVERSATION SO FAR:\n════════════════════\n(This is the start of the conversation.)"

        parts = ["CONVERSATION SO FAR:", "════════════════════"]

        # Include summary if we have more than SLIDING_WINDOW_SIZE turns
        if len(log) > SLIDING_WINDOW_SIZE and session.running_summary:
            parts.append(f"[Earlier: {session.running_summary}]")
            parts.append("---")

        # Last N turns
        window = log[-SLIDING_WINDOW_SIZE:]
        for turn in window:
            parts.append(f"{turn.speaker_name}: {turn.text}")

        return "\n".join(parts)

    async def maybe_update_summary(self, session: SessionState) -> None:
        """Update the running summary if enough turns have passed."""
        log = session.conversation_log
        if len(log) <= SLIDING_WINDOW_SIZE:
            return
        if len(log) % SUMMARIZE_EVERY != 0:
            return

        # Summarize everything except the sliding window
        turns_to_summarize = log[:-SLIDING_WINDOW_SIZE]
        turns_text = "\n".join(
            f"{t.speaker_name}: {t.text}" for t in turns_to_summarize
        )

        prompt = SUMMARY_USER.format(turns=turns_text)
        summary, _ = await self.llm.generate_response(
            system_prompt=SUMMARY_SYSTEM,
            user_message=prompt,
            model=DEFAULT_MODEL_CHEAP,
            max_tokens=150,
            use_cache=False,
        )
        session.running_summary = summary
        logger.info(f"Updated running summary: {summary[:80]}...")

    async def check_phase_coverage(self, session: SessionState) -> bool:
        """Ask Haiku if the current phase's territory has been covered."""
        phase = session.script.phases[session.current_phase]
        log = session.conversation_log

        # Get last 4 turns
        recent = log[-4:] if len(log) >= 4 else log
        turns_text = "\n".join(f"{t.speaker_name}: {t.text}" for t in recent)

        territory = phase.persona_a.territory + phase.persona_b.territory
        territory_text = "\n".join(f"- {t}" for t in territory)

        system = "You are evaluating whether a conversation phase is complete."
        user = (
            f'Phase: "{phase.description}"\n'
            f"Territory to cover:\n{territory_text}\n\n"
            f"Last turns:\n{turns_text}\n\n"
            "Has the core territory of this phase been sufficiently explored?\n"
            "Respond with exactly YES or NO."
        )

        response, _ = await self.llm.generate_response(
            system_prompt=system,
            user_message=user,
            model=DEFAULT_MODEL_CHEAP,
            max_tokens=10,
            use_cache=False,
        )
        return response.strip().upper().startswith("YES")
