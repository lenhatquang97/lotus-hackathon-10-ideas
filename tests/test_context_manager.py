"""Tests for context manager prompt assembly."""

import pytest
from unittest.mock import AsyncMock
from src.backend.content_loader import ContentLoader
from src.backend.context_manager import ContextManager, SLIDING_WINDOW_SIZE
from src.backend.models import SessionState, Turn


@pytest.fixture
def loader():
    return ContentLoader()


@pytest.fixture
def script(loader):
    return loader.load_script("salary_negotiation")


@pytest.fixture
def session(script):
    return SessionState(
        script=script,
        current_speaker=script.opening_speaker,
    )


@pytest.fixture
def ctx():
    mock_llm = AsyncMock()
    return ContextManager(llm_client=mock_llm)


def test_build_system_prompt(ctx, session):
    prompt = ctx.build_system_prompt(session)
    assert "You are John" in prompt
    assert "Marketing Specialist" in prompt
    assert "SOUL DOCUMENT" in prompt
    assert "Counterpart Briefing" not in prompt
    assert len(prompt) > 500


def test_build_user_message(ctx, session):
    msg = ctx.build_user_message(session)
    assert "SCENE DIRECTIVE" in msg
    assert "Salary Negotiation" in msg
    assert 'Phase 1 of 5' in msg
    assert "TERRITORY TO EXPLORE" in msg
    assert "YOUR COUNTERPART" in msg
    assert "It is your turn, John" in msg


def test_build_user_message_persona_b(ctx, session):
    session.current_speaker = "persona_b"
    msg = ctx.build_user_message(session)
    assert "It is your turn, Alice" in msg
    assert "YOUR COUNTERPART" in msg


def test_engagement_instruction(ctx, session):
    msg = ctx.build_user_message(
        session, engagement_template="What do you think about this?"
    )
    assert "turn to the Learner" in msg
    assert "What do you think about this?" in msg
    assert "It is your turn" not in msg


def test_learner_interruption(ctx, session):
    msg = ctx.build_user_message(session, learner_text="I agree with John")
    assert 'The Learner just said: "I agree with John"' in msg
    assert "Alice" in msg  # other persona name


def test_sliding_window(ctx, session):
    # Add 20 fake turns
    for i in range(20):
        speaker = "persona_a" if i % 2 == 0 else "persona_b"
        session.conversation_log.append(
            Turn(
                speaker=speaker,
                speaker_name="John" if speaker == "persona_a" else "Alice",
                text=f"Turn {i} text here",
                phase=0,
                turn_number=i,
            )
        )
    session.running_summary = "Earlier they discussed organic growth results."

    msg = ctx.build_user_message(session)
    # Should include summary
    assert "Earlier they discussed" in msg
    # Should include only last 8 turns
    assert "Turn 12" in msg
    assert "Turn 19" in msg
    # Should NOT include early turns
    assert "Turn 0 text" not in msg
    assert "Turn 11 text" not in msg


def test_empty_conversation_history(ctx, session):
    msg = ctx.build_user_message(session)
    assert "start of the conversation" in msg


def test_total_prompt_size(ctx, session):
    system = ctx.build_system_prompt(session)
    user = ctx.build_user_message(session)
    # Rough token estimate: ~4 chars per token
    total_chars = len(system) + len(user)
    estimated_tokens = total_chars / 4
    assert estimated_tokens < 6000, f"Prompt too large: ~{estimated_tokens:.0f} tokens"
