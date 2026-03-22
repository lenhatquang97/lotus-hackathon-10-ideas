from pydantic import BaseModel
from typing import Optional, List, Literal, Any, Dict
from datetime import datetime


class EvaluationSnapshot(BaseModel):
    tone_score: float = 0.0
    content_score: float = 0.0
    first_voice_score: float = 0.0


class TranscriptTurn(BaseModel):
    turn_id: str
    speaker: str
    character_id: Optional[str] = None
    character_name: Optional[str] = None
    text: str
    timestamp: datetime
    evaluation_snapshot: EvaluationSnapshot = EvaluationSnapshot()


class ToneEval(BaseModel):
    score: float = 0.0
    formality_calibration: float = 0.0
    assertiveness: float = 0.0
    emotional_congruence: float = 0.0


class ContentEval(BaseModel):
    score: float = 0.0
    topical_relevance: float = 0.0
    logical_coherence: float = 0.0
    vocabulary_range: float = 0.0
    grammar_fluency_index: float = 0.0


class FirstVoiceEval(BaseModel):
    score: float = 0.0
    speaking_time_ratio: float = 0.0
    turn_initiation_count: int = 0
    question_quality: float = 0.0
    interruption_events: int = 0


class HighlightItem(BaseModel):
    turn_id: str
    label: str
    coach_note: str


class VocabItem(BaseModel):
    word: str
    used_correctly: bool
    context: str


class GrammarCorrection(BaseModel):
    original: str
    corrected: str
    explanation: str


class SpeakingEval(BaseModel):
    fluency_score: float = 0.0
    pronunciation_tips: List[str] = []
    grammar_corrections: List[GrammarCorrection] = []
    filler_words: List[str] = []
    strengths: List[str] = []
    improvements: List[str] = []


class SessionEvaluation(BaseModel):
    composite_score: float = 0.0
    tone: ToneEval = ToneEval()
    content: ContentEval = ContentEval()
    first_voice: FirstVoiceEval = FirstVoiceEval()
    speaking: SpeakingEval = SpeakingEval()
    highlight_reel: List[HighlightItem] = []
    vocabulary_log: List[VocabItem] = []
    recommended_topic_ids: List[str] = []
    coach_narrative: str = ""


class SessionCreate(BaseModel):
    topic_id: str


class SessionResponse(BaseModel):
    id: str
    topic_id: str
    learner_id: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0
    transcript: List[TranscriptTurn] = []
    evaluation: Optional[SessionEvaluation] = None
    audio_file_id: Optional[str] = None
