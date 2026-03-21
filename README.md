# Lotus — World Building English Practice Platform

Immersive English practice through real-time AI character conversations with live performance evaluation.

## Quick Start

### Prerequisites
- Python 3.12+, uv
- Node.js 20+, pnpm
- MongoDB (local or Docker)
- OpenAI API key (required)
- ElevenLabs API key (optional — TTS voices)

### 1. Environment

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
```

### 2. Start MongoDB

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
# OR use docker-compose:
docker-compose up mongodb -d
```

### 3. Backend

```bash
cd backend
uv venv .venv
uv pip install -r requirements.txt
source .venv/bin/activate

# Copy env
cp .env.example .env   # fill OPENAI_API_KEY

# Seed demo data (5 topics + 2 users)
python seed.py

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

App: http://localhost:5173

---

## Demo Accounts (after seeding)

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Creator | creator@demo.com   | password123 |
| Learner | learner@demo.com   | password123 |

---

## Docker (all services)

```bash
cp .env.example .env   # fill OPENAI_API_KEY
docker-compose up --build
```

---

## Architecture

```
frontend (Vite + React + TS)
    │  REST + WebSocket
    ▼
backend (FastAPI + Motor)
    ├── /api/v1/auth       JWT auth
    ├── /api/v1/topics     Conversation topic CRUD
    ├── /api/v1/sessions   Session lifecycle
    └── /ws/session/:id    Real-time WebSocket
         │
         ├── Whisper STT   (OpenAI)
         ├── GPT-4o        (character responses)
         └── ElevenLabs    (TTS voices)

MongoDB
    ├── users
    ├── conversation_topics
    └── sessions
```

## Key Features

- **Creator Studio** — define topics with domain knowledge + up to 3 AI characters (persona, role, bias)
- **Live Session** — real-time spoken conversation via WebSocket audio streaming
- **HUD Arc** — live 3-dimension score display (Tone / Content / First Voice)
- **Silence Detection** — 6s warning, 10s character re-engagement
- **Post-Session Debrief** — GPT-4o coaching narrative, highlight reel, vocabulary log
- **Topic Catalog** — browse published topics, filter by CEFR / tags
