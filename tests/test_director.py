"""Tests for the director module."""

import pytest
from backend.src.director import decide_responder
from backend.src.content_loader import ContentLoader
from backend.src.models import SessionState


@pytest.fixture
def session():
    loader = ContentLoader()
    script = loader.load_script("salary_negotiation")
    return SessionState(
        script=script,
        current_speaker="persona_a",
    )


def test_responder_by_name_john(session):
    result = decide_responder(session, "Hey John, what do you think?")
    assert result == "persona_a"


def test_responder_by_name_alice(session):
    result = decide_responder(session, "Alice, is that fair?")
    assert result == "persona_b"


def test_responder_default_to_current(session):
    session.current_speaker = "persona_b"
    result = decide_responder(session, "I think the numbers are strong")
    assert result == "persona_b"


def test_responder_case_insensitive(session):
    result = decide_responder(session, "ALICE, you should reconsider")
    assert result == "persona_b"
