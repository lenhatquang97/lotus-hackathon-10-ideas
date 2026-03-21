from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class AvatarConfig(BaseModel):
    skin_tone: str = "medium"
    face_preset: str = "default"
    clothing: str = "casual"


class UserProfile(BaseModel):
    display_name: str
    avatar_config: AvatarConfig = AvatarConfig()


class CEFRInfo(BaseModel):
    self_assessed: Optional[str] = None
    calibrated: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    role: Literal["learner", "creator", "admin"] = "learner"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    profile: UserProfile
    cefr: CEFRInfo
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
