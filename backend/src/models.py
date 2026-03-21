"""Pydantic v2 data models for the conversation platform."""

from pydantic import BaseModel, Field
from typing import Optional
import uuid


class PersonaData(BaseModel):
    id: str
    name: str
    soul_document: str  # full markdown text for system prompt (minus counterpart briefing)
    counterpart_briefing: str  # compact summary for the other agent's prompt
    emotional_arc: list[str]  # parsed from ## Emotional Arc section


class PhasePersonaConfig(BaseModel):
    arc: str
    territory: list[str]
    instruction: str
    tone_example: str


class PhaseConfig(BaseModel):
    id: int
    name: str
    description: str
    persona_a: PhasePersonaConfig
    persona_b: PhasePersonaConfig
    min_turns: int
    max_turns: int
    engagement_eligible: bool


class ScriptData(BaseModel):
    id: str
    title: str
    description: str
    persona_a: PersonaData
    persona_b: PersonaData
    opening_speaker: str  # "persona_a" or "persona_b"
    learner_context: str
    phases: list[PhaseConfig]
    engagement_templates_a: list[str]
    engagement_templates_b: list[str]


class Turn(BaseModel):
    speaker: str  # "persona_a", "persona_b", or "learner"
    speaker_name: str  # "John", "Alice", "Learner"
    text: str
    phase: int
    turn_number: int
    is_engagement: bool = False


class SessionState(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    script: ScriptData
    current_phase: int = 0
    turn_number: int = 0
    current_speaker: str = "persona_a"  # "persona_a" or "persona_b"
    conversation_log: list[Turn] = Field(default_factory=list)
    running_summary: str = ""
    engagement_schedule: list[tuple[int, str]] = Field(default_factory=list)
    engagement_cooldown: int = 0
    awaiting_learner: bool = False
    phase_turn_count: int = 0
