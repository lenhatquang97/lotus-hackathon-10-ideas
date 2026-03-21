from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from app.db.mongodb import get_database


def _serialize_session(session: dict) -> dict:
    if not session:
        return None
    session = dict(session)
    session["id"] = str(session.pop("_id"))
    session["topic_id"] = str(session["topic_id"])
    session["learner_id"] = str(session["learner_id"])
    return session


async def create_session(topic_id: str, learner_id: str) -> dict:
    db = get_database()
    now = datetime.utcnow()
    session = {
        "topic_id": ObjectId(topic_id),
        "learner_id": ObjectId(learner_id),
        "status": "lobby",
        "started_at": None,
        "ended_at": None,
        "duration_seconds": 0,
        "transcript": [],
        "evaluation": None,
        "context_memory": {},
        "created_at": now,
    }
    result = await db.sessions.insert_one(session)
    session["_id"] = result.inserted_id
    return _serialize_session(session)


async def get_session_by_id(session_id: str) -> Optional[dict]:
    db = get_database()
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    return _serialize_session(session) if session else None


async def start_session(session_id: str) -> Optional[dict]:
    db = get_database()
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"status": "active", "started_at": datetime.utcnow()}},
    )
    return await get_session_by_id(session_id)


async def add_transcript_turn(session_id: str, turn: dict) -> None:
    db = get_database()
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)}, {"$push": {"transcript": turn}}
    )


async def complete_session(session_id: str, evaluation: dict) -> Optional[dict]:
    db = get_database()
    now = datetime.utcnow()
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    duration = 0
    if session and session.get("started_at"):
        duration = int((now - session["started_at"]).total_seconds())

    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": "completed",
                "ended_at": now,
                "duration_seconds": duration,
                "evaluation": evaluation,
            }
        },
    )
    return await get_session_by_id(session_id)


async def get_learner_sessions(
    learner_id: str, skip: int = 0, limit: int = 20
) -> List[dict]:
    db = get_database()
    cursor = (
        db.sessions.find({"learner_id": ObjectId(learner_id)})
        .skip(skip)
        .limit(limit)
        .sort("created_at", -1)
    )
    sessions = await cursor.to_list(length=limit)
    return [_serialize_session(s) for s in sessions]
