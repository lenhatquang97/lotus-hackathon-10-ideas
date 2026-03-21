from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


class CharacterCreate(BaseModel):
    name: str
    role: str
    persona: str
    bias_perception: str
    voice_id: str = "default"
    avatar_preset: str = "default"


class CharacterResponse(BaseModel):
    id: str
    name: str
    role: str
    persona: str
    bias_perception: str
    voice_id: str
    avatar_preset: str


class TopicCreate(BaseModel):
    title: str
    description: str
    domain_knowledge: str
    cefr_levels: List[str] = []
    tags: List[str] = []
    characters: List[CharacterCreate]


class TopicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    domain_knowledge: Optional[str] = None
    cefr_levels: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    characters: Optional[List[CharacterCreate]] = None


class TopicResponse(BaseModel):
    id: str
    creator_id: str
    title: str
    description: str
    domain_knowledge: str
    status: str
    cefr_levels: List[str]
    tags: List[str]
    characters: List[CharacterResponse]
    play_count: int
    avg_score: float
    created_at: datetime
    updated_at: datetime
