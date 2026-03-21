import logging
import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db():
    global _client, _db
    url = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "lotus_hack")
    _client = AsyncIOMotorClient(url)
    _db = _client[db_name]
    # Verify connection
    await _client.admin.command("ping")
    logger.info(f"Connected to MongoDB | url={url} db={db_name}")


async def close_db():
    global _client, _db
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")
    _client = None
    _db = None


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialized — call connect_db() first")
    return _db


async def list_topics() -> list[dict]:
    db = get_db()
    cursor = db.conversation_topics.find({})
    topics = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        # Normalize character ids
        for char in doc.get("characters", []):
            if "_id" in char:
                char["id"] = str(char.pop("_id"))
        topics.append(doc)
    logger.info(f"Listed {len(topics)} topics from MongoDB")
    return topics


async def get_topic(topic_id: str) -> dict | None:
    from bson import ObjectId
    db = get_db()
    doc = await db.conversation_topics.find_one({"_id": ObjectId(topic_id)})
    if doc is None:
        logger.warning(f"Topic not found: {topic_id}")
        return None
    doc["id"] = str(doc.pop("_id"))
    for char in doc.get("characters", []):
        if "_id" in char:
            char["id"] = str(char.pop("_id"))
    logger.info(f"Fetched topic: {doc.get('title', '?')} ({topic_id})")
    return doc
