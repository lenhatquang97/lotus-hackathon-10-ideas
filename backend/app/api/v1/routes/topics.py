from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from app.models.topic import (
    TopicCreate,
    TopicUpdate,
    TopicResponse,
    CharacterCreate,
    CharacterResponse,
)
from app.db.repositories import topic_repo
from app.api.v1.routes.auth import get_current_user

router = APIRouter()


def _format_topic(topic: dict) -> TopicResponse:
    chars = [
        CharacterResponse(
            id=c["id"],
            name=c["name"],
            role=c["role"],
            persona=c.get("persona", ""),
            bias_perception=c.get("bias_perception", ""),
            voice_id=c.get("voice_id", "default"),
            avatar_preset=c.get("avatar_preset", "default"),
        )
        for c in topic.get("characters", [])
    ]
    return TopicResponse(
        id=topic["id"],
        creator_id=topic["creator_id"],
        title=topic["title"],
        description=topic.get("description", ""),
        domain_knowledge=topic.get("domain_knowledge", ""),
        status=topic.get("status", "draft"),
        cefr_levels=topic.get("cefr_levels", []),
        tags=topic.get("tags", []),
        characters=chars,
        play_count=topic.get("play_count", 0),
        avg_score=topic.get("avg_score", 0.0),
        created_at=topic.get("created_at"),
        updated_at=topic.get("updated_at"),
    )


@router.get("/", response_model=List[TopicResponse])
async def list_topics(
    tags: Optional[str] = Query(None),
    cefr: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
):
    tag_list = tags.split(",") if tags else None
    cefr_list = cefr.split(",") if cefr else None
    topics = await topic_repo.get_topics(
        status="published", tags=tag_list, cefr=cefr_list, skip=skip, limit=limit
    )
    return [_format_topic(t) for t in topics]


@router.get("/my", response_model=List[TopicResponse])
async def my_topics(current_user: dict = Depends(get_current_user)):
    topics = await topic_repo.get_creator_topics(current_user["id"])
    return [_format_topic(t) for t in topics]


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str):
    topic = await topic_repo.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return _format_topic(topic)


@router.post("/", response_model=TopicResponse)
async def create_topic(
    data: TopicCreate, current_user: dict = Depends(get_current_user)
):
    if len(data.characters) < 1 or len(data.characters) > 3:
        raise HTTPException(
            status_code=400, detail="Topics must have 1-3 characters"
        )
    topic = await topic_repo.create_topic(current_user["id"], data.model_dump())
    return _format_topic(topic)


@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(
    topic_id: str,
    data: TopicUpdate,
    current_user: dict = Depends(get_current_user),
):
    topic = await topic_repo.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if data.characters is not None and (
        len(data.characters) < 1 or len(data.characters) > 3
    ):
        raise HTTPException(
            status_code=400, detail="Topics must have 1-3 characters"
        )
    updated = await topic_repo.update_topic(
        topic_id, data.model_dump(exclude_none=True)
    )
    return _format_topic(updated)


@router.delete("/{topic_id}")
async def delete_topic(
    topic_id: str, current_user: dict = Depends(get_current_user)
):
    topic = await topic_repo.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await topic_repo.delete_topic(topic_id)
    return {"message": "Deleted"}


@router.post("/{topic_id}/publish", response_model=TopicResponse)
async def publish_topic(
    topic_id: str, current_user: dict = Depends(get_current_user)
):
    topic = await topic_repo.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if len(topic.get("characters", [])) < 1:
        raise HTTPException(
            status_code=400,
            detail="Topic must have at least 1 character to publish",
        )
    updated = await topic_repo.publish_topic(topic_id)
    return _format_topic(updated)


@router.post("/{topic_id}/characters", response_model=TopicResponse)
async def add_character(
    topic_id: str,
    data: CharacterCreate,
    current_user: dict = Depends(get_current_user),
):
    topic = await topic_repo.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if len(topic.get("characters", [])) >= 3:
        raise HTTPException(
            status_code=400, detail="Maximum 3 characters per topic"
        )
    updated = await topic_repo.add_character(topic_id, data.model_dump())
    return _format_topic(updated)


@router.put("/{topic_id}/characters/{character_id}", response_model=TopicResponse)
async def update_character(
    topic_id: str,
    character_id: str,
    data: CharacterCreate,
    current_user: dict = Depends(get_current_user),
):
    topic = await topic_repo.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated = await topic_repo.update_character(
        topic_id, character_id, data.model_dump()
    )
    return _format_topic(updated)


@router.delete(
    "/{topic_id}/characters/{character_id}", response_model=TopicResponse
)
async def delete_character(
    topic_id: str,
    character_id: str,
    current_user: dict = Depends(get_current_user),
):
    topic = await topic_repo.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated = await topic_repo.delete_character(topic_id, character_id)
    return _format_topic(updated)
