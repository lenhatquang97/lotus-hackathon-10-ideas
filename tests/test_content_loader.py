"""Tests for content loading and validation."""

import pytest
from backend.src.content_loader import ContentLoader


@pytest.fixture
def loader():
    return ContentLoader()


def test_load_persona_john(loader):
    john = loader.load_persona("john")
    assert john.id == "john"
    assert john.name == "John"
    assert len(john.soul_document) > 500
    assert "Counterpart Briefing" not in john.soul_document
    assert len(john.counterpart_briefing) > 20
    assert len(john.emotional_arc) == 5
    assert "Opens warm and confident" in john.emotional_arc[0]


def test_load_persona_alice(loader):
    alice = loader.load_persona("alice")
    assert alice.id == "alice"
    assert alice.name == "Alice"
    assert len(alice.soul_document) > 500
    assert "Counterpart Briefing" not in alice.soul_document
    assert len(alice.counterpart_briefing) > 20
    assert len(alice.emotional_arc) == 5
    assert "relaxed" in alice.emotional_arc[0].lower()


def test_persona_caching(loader):
    john1 = loader.load_persona("john")
    john2 = loader.load_persona("john")
    assert john1 is john2


def test_load_script(loader):
    script = loader.load_script("salary_negotiation")
    assert script.id == "salary_negotiation"
    assert script.title == "Salary Negotiation"
    assert script.persona_a.name == "John"
    assert script.persona_b.name == "Alice"
    assert script.opening_speaker == "persona_a"
    assert len(script.phases) == 5
    assert len(script.engagement_templates_a) == 4
    assert len(script.engagement_templates_b) == 4
    assert len(script.learner_context) > 20


def test_script_phases(loader):
    script = loader.load_script("salary_negotiation")
    phase1 = script.phases[0]
    assert phase1.name == "the_opening"
    assert phase1.min_turns == 3
    assert phase1.max_turns == 6
    assert phase1.engagement_eligible is True
    assert len(phase1.persona_a.territory) == 2
    assert len(phase1.persona_b.territory) == 2

    phase5 = script.phases[4]
    assert phase5.name == "the_resolution"
    assert phase5.engagement_eligible is False


def test_invalid_persona_raises(loader):
    with pytest.raises(ValueError, match="not found"):
        loader.load_persona("nonexistent")


def test_list_scripts(loader):
    scripts = loader.list_scripts()
    assert len(scripts) >= 1
    assert scripts[0]["id"] == "salary_negotiation"


def test_list_personas(loader):
    personas = loader.list_personas()
    assert len(personas) >= 2
    ids = [p["id"] for p in personas]
    assert "john" in ids
    assert "alice" in ids


def test_validate_all(loader):
    loader.validate_all()  # should not raise
