import json
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.db.mongodb import get_database, get_gridfs_bucket
from app.models.session import (
    SessionCreate,
    SessionResponse,
    SessionEvaluation,
    TranscriptTurn,
    EvaluationSnapshot,
    ToneEval,
    ContentEval,
    FirstVoiceEval,
    SpeakingEval,
    GrammarCorrection,
    HighlightItem,
    VocabItem,
)
from app.db.repositories import session_repo, topic_repo
from app.api.v1.routes.auth import get_current_user
from app.agents.orchestrator import ConversationOrchestrator

router = APIRouter()


def _format_session(session: dict) -> SessionResponse:
    transcript = []
    for t in session.get("transcript", []):
        transcript.append(
            TranscriptTurn(
                turn_id=t.get("turn_id", ""),
                speaker=t.get("speaker", "learner"),
                character_id=t.get("character_id"),
                character_name=t.get("character_name"),
                text=t.get("text", ""),
                timestamp=t.get("timestamp"),
                evaluation_snapshot=EvaluationSnapshot(
                    **t.get("evaluation_snapshot", {})
                ),
            )
        )

    evaluation = None
    if session.get("evaluation"):
        e = session["evaluation"]
        speaking_data = e.get("speaking", {})
        speaking = SpeakingEval(
            fluency_score=speaking_data.get("fluency_score", 0.0),
            pronunciation_tips=speaking_data.get("pronunciation_tips", []),
            grammar_corrections=[
                GrammarCorrection(**g) for g in speaking_data.get("grammar_corrections", [])
            ],
            filler_words=speaking_data.get("filler_words", []),
            strengths=speaking_data.get("strengths", []),
            improvements=speaking_data.get("improvements", []),
        )
        evaluation = SessionEvaluation(
            composite_score=e.get("composite_score", 0.0),
            tone=ToneEval(**e.get("tone", {})),
            content=ContentEval(**e.get("content", {})),
            first_voice=FirstVoiceEval(**e.get("first_voice", {})),
            speaking=speaking,
            highlight_reel=[HighlightItem(**h) for h in e.get("highlight_reel", [])],
            vocabulary_log=[VocabItem(**v) for v in e.get("vocabulary_log", [])],
            recommended_topic_ids=e.get("recommended_topic_ids", []),
            coach_narrative=e.get("coach_narrative", ""),
        )

    return SessionResponse(
        id=session["id"],
        topic_id=session["topic_id"],
        learner_id=session["learner_id"],
        status=session.get("status", "lobby"),
        started_at=session.get("started_at"),
        ended_at=session.get("ended_at"),
        duration_seconds=session.get("duration_seconds", 0),
        transcript=transcript,
        evaluation=evaluation,
        audio_file_id=session.get("audio_file_id"),
    )


@router.post("/", response_model=SessionResponse)
async def create_session(
    data: SessionCreate, current_user: dict = Depends(get_current_user)
):
    topic = await topic_repo.get_topic_by_id(data.topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    session = await session_repo.create_session(data.topic_id, current_user["id"])
    return _format_session(session)


@router.get("/history", response_model=List[SessionResponse])
async def session_history(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    sessions = await session_repo.get_learner_sessions(
        current_user["id"], skip=skip, limit=limit
    )
    return [_format_session(s) for s in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str, current_user: dict = Depends(get_current_user)
):
    session = await session_repo.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _format_session(session)


@router.put("/{session_id}/start", response_model=SessionResponse)
async def start_session(
    session_id: str, current_user: dict = Depends(get_current_user)
):
    session = await session_repo.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["learner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    updated = await session_repo.start_session(session_id)
    return _format_session(updated)


@router.put("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str, current_user: dict = Depends(get_current_user)
):
    session = await session_repo.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["learner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Trigger evaluation
    from app.evaluator.engine import EvaluationEngine
    from app.db.repositories import topic_repo as tr

    topic = await tr.get_topic_by_id(session["topic_id"])
    evaluator = EvaluationEngine()
    evaluation = await evaluator.compute_final_evaluation(
        session.get("transcript", []), topic or {}
    )
    updated = await session_repo.complete_session(session_id, evaluation)
    return _format_session(updated)


@router.get("/{session_id}/transcript")
async def get_transcript(
    session_id: str, current_user: dict = Depends(get_current_user)
):
    session = await session_repo.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"transcript": session.get("transcript", [])}


@router.get("/{session_id}/evaluation")
async def get_evaluation(
    session_id: str, current_user: dict = Depends(get_current_user)
):
    session = await session_repo.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.get("evaluation"):
        raise HTTPException(
            status_code=404, detail="Evaluation not yet available"
        )
    return session["evaluation"]


@router.post("/{session_id}/audio")
async def upload_session_audio(
    session_id: str,
    audio: UploadFile = File(...),
):
    db = get_database()
    bucket = get_gridfs_bucket()

    file_id = await bucket.upload_from_stream(
        f"session-{session_id}.webm",
        audio.file,
        metadata={"session_id": session_id, "content_type": audio.content_type or "audio/webm"},
    )

    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"audio_file_id": str(file_id)}},
    )

    return {"status": "ok", "audio_file_id": str(file_id)}


@router.get("/{session_id}/audio")
async def get_session_audio(session_id: str):
    db = get_database()
    session = await db.sessions.find_one({"id": session_id})
    if not session or not session.get("audio_file_id"):
        raise HTTPException(status_code=404, detail="Audio not found")

    bucket = get_gridfs_bucket()
    grid_out = await bucket.open_download_stream(ObjectId(session["audio_file_id"]))

    async def stream_audio():
        while True:
            chunk = await grid_out.read(8192)
            if not chunk:
                break
            yield chunk

    return StreamingResponse(stream_audio(), media_type="audio/webm")


@router.websocket("/ws/session/{session_id}")
async def session_websocket(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(default=None),
):
    from app.core.security import verify_token
    from app.db.repositories import user_repo as u_repo

    # Validate token before accepting — browsers can't send custom WS headers
    if not token:
        await websocket.close(code=4001)
        return
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    user = await u_repo.get_user_by_id(payload.get("sub"))
    if not user:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    orchestrator = ConversationOrchestrator(session_id, websocket)
    try:
        while True:
            data = await websocket.receive()
            if "text" in data:
                try:
                    event = json.loads(data["text"])
                    await orchestrator.handle_event(event)
                except json.JSONDecodeError:
                    pass
            elif "bytes" in data:
                await orchestrator.handle_audio_chunk(data["bytes"])
    except WebSocketDisconnect:
        await orchestrator.cleanup()
    except Exception as e:
        print(f"WebSocket error: {e}")
        await orchestrator.cleanup()
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
