"""FastAPI application with WebSocket and REST endpoints."""

import asyncio
import json
import logging
import os

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .content_loader import ContentLoader
from .director import Director
from .llm_client import LLMClient

load_dotenv(Path(__file__).parent.parent / ".env")

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Convo AI Backend", version="0.1.0")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global content loader — loaded once at startup
content_loader: ContentLoader | None = None


@app.on_event("startup")
async def startup():
    global content_loader
    content_loader = ContentLoader()
    content_loader.validate_all()
    logger.info("Content loaded and validated successfully")


# ── REST Endpoints ──


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/scripts")
async def list_scripts():
    return content_loader.list_scripts()


@app.get("/api/scripts/{script_id}")
async def get_script(script_id: str):
    try:
        script = content_loader.load_script(script_id)
        return {
            "id": script.id,
            "title": script.title,
            "description": script.description,
            "persona_a": {
                "id": script.persona_a.id,
                "name": script.persona_a.name,
            },
            "persona_b": {
                "id": script.persona_b.id,
                "name": script.persona_b.name,
            },
            "phases": len(script.phases),
        }
    except ValueError as e:
        return {"error": str(e)}


@app.get("/api/personas")
async def list_personas():
    return content_loader.list_personas()


# ── WebSocket Endpoint ──


@app.websocket("/ws/session")
async def websocket_session(ws: WebSocket):
    await ws.accept()
    logger.info("WebSocket connected")

    director_task: asyncio.Task | None = None
    user_input_queue: asyncio.Queue = asyncio.Queue()

    try:
        # Wait for start message
        start_msg = await ws.receive_text()
        data = json.loads(start_msg)

        if data.get("action") != "start" or "script_id" not in data:
            await ws.send_json(
                {"type": "error", "message": "Expected {action: 'start', script_id: '...'}"}
            )
            await ws.close()
            return

        script_id = data["script_id"]
        logger.info(f"Starting session with script: {script_id}")

        # Create director
        llm = LLMClient()
        director = Director(
            script_id=script_id,
            content_loader=content_loader,
            llm_client=llm,
            enable_engagement=True,
        )
        director.create_session()

        # Send callback
        async def send_message(msg: dict):
            try:
                await ws.send_json(msg)
            except Exception:
                logger.warning("Failed to send WebSocket message")

        # Start conversation loop as background task
        director_task = asyncio.create_task(
            director.run_conversation(
                send_message=send_message,
                user_input_queue=user_input_queue,
            )
        )

        # Receive loop — forward user input to director
        while True:
            try:
                raw = await ws.receive_text()
                msg = json.loads(raw)
                action = msg.get("action")

                if action == "ping":
                    await ws.send_json({"type": "pong"})
                elif action == "speak":
                    await user_input_queue.put(msg)
                elif action == "end":
                    await user_input_queue.put(msg)
                    break
                else:
                    logger.warning(f"Unknown action: {action}")
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON from client: {e}")
        try:
            await ws.send_json({"type": "error", "message": "Invalid JSON"})
        except Exception:
            pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        if director_task and not director_task.done():
            director_task.cancel()
            try:
                await director_task
            except asyncio.CancelledError:
                pass
        logger.info("WebSocket session cleaned up")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.src.main:app", host=host, port=port, reload=True)
