from bson import ObjectId
from datetime import datetime
from typing import Optional
from app.db.mongodb import get_database
from app.core.security import get_password_hash, verify_password


def _serialize_user(user: dict) -> dict:
    if not user:
        return None
    user = dict(user)
    user["id"] = str(user.pop("_id"))
    return user


async def create_user(
    email: str, password: str, display_name: str, role: str = "learner"
) -> dict:
    db = get_database()
    now = datetime.utcnow()
    user = {
        "email": email,
        "password_hash": get_password_hash(password),
        "role": role,
        "profile": {
            "display_name": display_name,
            "avatar_config": {
                "skin_tone": "medium",
                "face_preset": "default",
                "clothing": "casual",
            },
        },
        "cefr": {"self_assessed": None, "calibrated": None},
        "institution_id": None,
        "cohort_ids": [],
        "created_at": now,
    }
    result = await db.users.insert_one(user)
    user["_id"] = result.inserted_id
    return _serialize_user(user)


async def get_user_by_email(email: str) -> Optional[dict]:
    db = get_database()
    user = await db.users.find_one({"email": email})
    return _serialize_user(user) if user else None


async def get_user_by_id(user_id: str) -> Optional[dict]:
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return _serialize_user(user) if user else None


async def get_user_with_password(email: str) -> Optional[dict]:
    """Returns user dict including password_hash (for auth only)"""
    db = get_database()
    user = await db.users.find_one({"email": email})
    if not user:
        return None
    result = dict(user)
    result["id"] = str(result.pop("_id"))
    return result


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    user = await get_user_with_password(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user
