from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    UserProfile,
    CEFRInfo,
    AvatarConfig,
)
from app.db.repositories import user_repo
from app.core.security import create_access_token, verify_token
from datetime import timedelta

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _format_user(user: dict) -> UserResponse:
    profile_data = user.get("profile", {})
    avatar_data = profile_data.get("avatar_config", {})
    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        profile=UserProfile(
            display_name=profile_data.get("display_name", ""),
            avatar_config=AvatarConfig(**avatar_data) if avatar_data else AvatarConfig(),
        ),
        cefr=CEFRInfo(**user.get("cefr", {})),
        created_at=user.get("created_at"),
    )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    user = await user_repo.get_user_by_id(payload.get("sub"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await user_repo.get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters"
        )

    user = await user_repo.create_user(
        data.email, data.password, data.display_name, data.role
    )
    token = create_access_token({"sub": user["id"]})
    return TokenResponse(access_token=token, user=_format_user(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await user_repo.authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user["id"]})
    return TokenResponse(access_token=token, user=_format_user(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _format_user(current_user)
