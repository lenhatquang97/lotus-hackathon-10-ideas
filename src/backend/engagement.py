"""Engagement engine — determines when and how agents ask the learner for input."""

import random

from .models import SessionState, ScriptData


def generate_engagement_schedule(
    script: ScriptData, seed: int | None = None
) -> list[tuple[int, str]]:
    """
    Generate a schedule of (estimated_turn_number, speaker) for engagement triggers.
    60% chance of engagement per eligible phase.
    """
    rng = random.Random(seed)
    schedule = []
    estimated_turn = 0

    for phase in script.phases:
        if not phase.engagement_eligible:
            estimated_turn += (phase.min_turns + phase.max_turns) // 2
            continue

        # 60% chance of engagement per eligible phase
        if rng.random() < 0.6:
            mid = estimated_turn + (phase.min_turns + phase.max_turns) // 4
            turn = rng.randint(max(0, mid - 1), mid + 2)
            speaker = rng.choice(["persona_a", "persona_b"])
            schedule.append((turn, speaker))

        estimated_turn += (phase.min_turns + phase.max_turns) // 2

    return schedule


def should_trigger_engagement(session: SessionState) -> bool:
    """Check if an engagement should trigger on this turn."""
    if session.engagement_cooldown > 0:
        session.engagement_cooldown -= 1
        return False

    for sched_turn, sched_speaker in session.engagement_schedule:
        if (
            abs(session.turn_number - sched_turn) <= 1
            and session.current_speaker == sched_speaker
        ):
            session.engagement_cooldown = 4
            return True

    return False


def select_engagement_question(session: SessionState) -> str:
    """Pick an engagement template for the current speaker."""
    if session.current_speaker == "persona_a":
        templates = session.script.engagement_templates_a
    else:
        templates = session.script.engagement_templates_b

    rng = random.Random(session.turn_number)
    return rng.choice(templates)
