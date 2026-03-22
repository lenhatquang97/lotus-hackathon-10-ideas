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


class VocabItem(BaseModel):
    word: str
    definition: str


class TopicCreate(BaseModel):
    title: str
    description: str
    domain_knowledge: str
    difficulty_levels: List[str] = []
    tags: List[str] = []
    characters: List[CharacterCreate]
    vocabulary: List[VocabItem] = []


class TopicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    domain_knowledge: Optional[str] = None
    difficulty_levels: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    characters: Optional[List[CharacterCreate]] = None
    vocabulary: Optional[List[VocabItem]] = None


class TopicResponse(BaseModel):
    id: str
    creator_id: str
    title: str
    description: str
    domain_knowledge: str
    status: str
    difficulty_levels: List[str]
    tags: List[str]
    characters: List[CharacterResponse]
    vocabulary: List[VocabItem] = []
    play_count: int
    avg_score: float
    created_at: datetime
    updated_at: datetime
