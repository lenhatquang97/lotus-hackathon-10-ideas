import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db import connect_db, close_db
from app.manager import RoomManager
from app.routes import create_router

load_dotenv()

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)-20s | %(message)s",
    datefmt="%H:%M:%S",
)
for mod in ("app.agent", "app.script", "app.room", "app.db", "app.manager", "app.routes"):
    logging.getLogger(mod).setLevel(logging.DEBUG)

BASE_DIR = Path(__file__).parent

room_manager = RoomManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="LLM Chat Room — Conversational AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.include_router(create_router(room_manager))


@app.get("/")
async def index():
    return FileResponse(str(BASE_DIR / "static" / "index.html"))


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
