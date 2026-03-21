# Lotus — World Building English Practice Platform

> *Don't study English. Inhabit it.*

Lotus is an immersive English practice platform where learners hold real spoken conversations with AI characters inside hand-crafted scenarios. Creators define **Conversation Worlds** — a situation, shared context, and up to three characters each with their own persona, role, and bias. Learners drop in, speak freely, and receive coaching on three live dimensions: **Tone**, **Content**, and **First Voice**.

---

## How it works

**For learners**
1. Browse the world catalog and pick a scenario (salary negotiation, climate debate, job interview, etc.)
2. Enter the lobby, check your microphone, then drop in
3. Speak with 1–3 AI characters in a 3D environment — each responds based on their persona and the shared domain context
4. Receive a post-session debrief: overall score, dimension breakdown, coach narrative, highlight reel, and vocabulary log

**For creators**
1. Open Creator Studio and fill in a world form: title, background context (shared facts all characters know), and 1–3 characters with name / role / persona / bias
2. Save as draft or publish directly to the learner catalog
3. Track play count and average scores per world

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 18 + TypeScript, Tailwind CSS, Zustand |
| 3D scene | React Three Fiber v8, `@react-three/drei`, Three.js |
| Backend | Python 3.12, FastAPI, Motor (async MongoDB driver) |
| Database | MongoDB 7 |
| STT | OpenAI Whisper API |
| LLM | GPT-4o (character responses + evaluation narrative) |
| TTS | ElevenLabs REST API (optional) |
| Auth | JWT via `python-jose` + `passlib` bcrypt |

---

## Prerequisites

- **Python 3.12+** and **uv** (`brew install uv`)
- **Node.js 20+** and **pnpm** (`npm i -g pnpm`)
- **MongoDB 7** (local install or Docker)
- **OpenAI API key** (required — used for Whisper STT, GPT-4o responses, and evaluation)
- **ElevenLabs API key** (optional — character TTS voices; falls back to silence without it)

---

## Installation

### 1. Clone and enter the project

```bash
git clone <repo-url>
cd source
```

### 2. Environment variables

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```env
OPENAI_API_KEY=sk-...
```

Optionally add:

```env
ELEVENLABS_API_KEY=...   # for character voices
SECRET_KEY=change-me     # JWT signing key
```

### 3. Start MongoDB

Using Docker (recommended):

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

Or with Docker Compose (starts all services together — see step 6):

```bash
docker-compose up mongodb -d
```

### 4. Backend setup

```bash
cd backend

# Create virtual environment and install dependencies
uv venv .venv
uv pip install -r requirements.txt

# Activate the environment
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows

# Copy env file
cp .env.example .env               # then fill in OPENAI_API_KEY

# Seed demo data (5 worlds + 2 demo accounts)
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### 5. Frontend setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The app will be available at **http://localhost:5173**

---

## Demo accounts

After running `python seed.py` the following accounts are available:

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Learner | learner@demo.com   | password123 |
| Creator | creator@demo.com   | password123 |

Five published worlds are seeded:
- Negotiating a Salary Raise
- Climate Change Town Hall
- Medical Consultation: Diagnosis Discussion
- Job Interview at a Tech Startup
- Hotel Complaint Resolution

---

## Docker Compose (all services)

To run the full stack in containers:

```bash
cp .env.example .env   # set OPENAI_API_KEY
docker-compose up --build
```

Services started:
- `mongodb` on port 27017
- `backend` on port 8000
- `frontend` on port 5173

---

## Project structure

```
source/
├── backend/
│   ├── app/
│   │   ├── agents/          # ConversationOrchestrator + per-character GPT-4o agents
│   │   ├── api/v1/routes/   # auth, topics, sessions (REST + WebSocket)
│   │   ├── core/            # config, JWT security
│   │   ├── db/              # Motor client + repositories
│   │   ├── evaluator/       # Tone / Content / First Voice scoring engine
│   │   ├── models/          # Pydantic request/response models
│   │   └── services/        # Whisper STT, ElevenLabs TTS
│   ├── seed.py              # Demo data seeder
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.tsx
│       │   └── scene/       # Scene3D, AgentAvatar, Room (Three.js)
│       ├── hooks/            # useSessionSocket (WebSocket + MediaRecorder)
│       ├── pages/            # 12 route-level pages
│       ├── services/         # Axios API client
│       ├── stores/           # authStore, sessionStore (Zustand)
│       └── types/
│
└── docker-compose.yml
```

---

## WebSocket session protocol

The active session communicates over `ws://localhost:8000/api/v1/sessions/ws/session/:id`.

**Client → Server:** `start_session`, `end_session`, `mic_active`, binary audio chunks (500ms WebM)

**Server → Client:** `session_state`, `character_speech_start/end`, binary TTS audio, `transcript_update`, `live_scores` (tone / content / first_voice), `silence_warning`

Silence detection triggers a re-engagement prompt from the first character at 10 seconds.
