from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from app.db.mongodb import get_database


def _serialize_topic(topic: dict) -> dict:
    if not topic:
        return None
    topic = dict(topic)
    topic["id"] = str(topic.pop("_id"))
    topic["creator_id"] = str(topic["creator_id"])
    # Serialize character _ids
    chars = []
    for c in topic.get("characters", []):
        c = dict(c)
        c["id"] = str(c.pop("_id", ObjectId()))
        chars.append(c)
    topic["characters"] = chars
    return topic


async def create_topic(creator_id: str, data: dict) -> dict:
    db = get_database()
    now = datetime.utcnow()
    characters = []
    for c in data.get("characters", []):
        char = dict(c)
        char["_id"] = ObjectId()
        characters.append(char)

    topic = {
        "creator_id": ObjectId(creator_id),
        "title": data["title"],
        "description": data["description"],
        "domain_knowledge": data["domain_knowledge"],
        "status": "draft",
        "difficulty_levels": data.get("difficulty_levels", []),
        "tags": data.get("tags", []),
        "characters": characters,
        "play_count": 0,
        "avg_score": 0.0,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.conversation_topics.insert_one(topic)
    topic["_id"] = result.inserted_id
    return _serialize_topic(topic)


async def get_topic_by_id(topic_id: str) -> Optional[dict]:
    db = get_database()
    topic = await db.conversation_topics.find_one({"_id": ObjectId(topic_id)})
    return _serialize_topic(topic) if topic else None


async def get_topics(
    status: Optional[str] = "published",
    tags: Optional[List[str]] = None,
    difficulty: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[dict]:
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    if tags:
        query["tags"] = {"$in": tags}
    if difficulty:
        query["difficulty_levels"] = {"$in": difficulty}

    cursor = (
        db.conversation_topics.find(query)
        .skip(skip)
        .limit(limit)
        .sort("created_at", -1)
    )
    topics = await cursor.to_list(length=limit)
    return [_serialize_topic(t) for t in topics]


async def get_creator_topics(creator_id: str) -> List[dict]:
    db = get_database()
    cursor = db.conversation_topics.find(
        {"creator_id": ObjectId(creator_id)}
    ).sort("created_at", -1)
    topics = await cursor.to_list(length=100)
    return [_serialize_topic(t) for t in topics]


async def update_topic(topic_id: str, update_data: dict) -> Optional[dict]:
    db = get_database()
    update_data["updated_at"] = datetime.utcnow()

    if "characters" in update_data and update_data["characters"] is not None:
        characters = []
        for c in update_data["characters"]:
            char = dict(c) if not isinstance(c, dict) else c
            char["_id"] = ObjectId()
            characters.append(char)
        update_data["characters"] = characters

    update_data = {k: v for k, v in update_data.items() if v is not None}

    await db.conversation_topics.update_one(
        {"_id": ObjectId(topic_id)}, {"$set": update_data}
    )
    return await get_topic_by_id(topic_id)


async def publish_topic(topic_id: str) -> Optional[dict]:
    db = get_database()
    await db.conversation_topics.update_one(
        {"_id": ObjectId(topic_id)},
        {"$set": {"status": "published", "updated_at": datetime.utcnow()}},
    )
    return await get_topic_by_id(topic_id)


async def delete_topic(topic_id: str) -> bool:
    db = get_database()
    result = await db.conversation_topics.delete_one({"_id": ObjectId(topic_id)})
    return result.deleted_count > 0


async def add_character(topic_id: str, character_data: dict) -> Optional[dict]:
    db = get_database()
    character = dict(character_data)
    character["_id"] = ObjectId()
    await db.conversation_topics.update_one(
        {"_id": ObjectId(topic_id)},
        {
            "$push": {"characters": character},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
    return await get_topic_by_id(topic_id)


async def update_character(
    topic_id: str, character_id: str, update_data: dict
) -> Optional[dict]:
    db = get_database()
    set_fields = {f"characters.$.{k}": v for k, v in update_data.items()}
    set_fields["updated_at"] = datetime.utcnow()
    await db.conversation_topics.update_one(
        {
            "_id": ObjectId(topic_id),
            "characters._id": ObjectId(character_id),
        },
        {"$set": set_fields},
    )
    return await get_topic_by_id(topic_id)


async def delete_character(topic_id: str, character_id: str) -> Optional[dict]:
    db = get_database()
    await db.conversation_topics.update_one(
        {"_id": ObjectId(topic_id)},
        {
            "$pull": {"characters": {"_id": ObjectId(character_id)}},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
    return await get_topic_by_id(topic_id)
