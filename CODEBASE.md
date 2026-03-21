# Codebase Structure

Convo AI is an interactive web app that simulates realistic conversations between two AI-powered avatars in a 3D virtual room. Learners observe and can participate in these conversations.

## Directory Layout

```
convo_ai/
├── backend/
│   ├── src/                     # Python FastAPI backend
│   │   ├── main.py              # FastAPI app, REST + WebSocket endpoints
│   │   ├── director.py          # Conversation orchestrator (state machine)
│   │   ├── context_manager.py   # 3-layer prompt assembly + history
│   │   ├── llm_client.py        # Anthropic Claude API wrapper
│   │   ├── content_loader.py    # YAML/Markdown parser & validator
│   │   ├── engagement.py        # Learner engagement scheduling
│   │   ├── models.py            # Pydantic data models
│   │   └── __main__.py          # CLI entry point
│   ├── requirements.txt
│   └── .env / .env.example
│
├── frontend/
│   ├── src/                     # Next.js 14 + TypeScript frontend
│   │   ├── app/
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── globals.css      # Styles
│   │   │   └── api/
│   │   │       ├── tts/route.ts            # Google Cloud TTS proxy
│   │   │       └── realtime-token/route.ts # OpenAI Realtime token provider
│   │   ├── components/
│   │   │   ├── VirtualRoom.tsx  # Main orchestrator component
│   │   │   ├── ThreeCanvas.tsx  # 3D scene container
│   │   │   ├── ControlPanel.tsx # Input UI (text + mic)
│   │   │   └── Transcript.tsx   # Chat display
│   │   ├── lib/
│   │   │   ├── types.ts         # TypeScript types
│   │   │   ├── ws-client.ts     # WebSocket client
│   │   │   ├── room-manager.ts  # TalkingHead avatar management
│   │   │   └── realtime-transcriber.ts  # Speech-to-text via OpenAI
│   │   ├── public/
│   │   │   ├── avatars/         # GLB avatar models (alice.glb, john.glb)
│   │   │   ├── cool_office.png  # Background image
│   │   │   └── audioProcessor.js
│   │   ├── package.json
│   │   └── next.config.mjs
│   └── .env / .env.example
│
├── content/                     # Script & persona definitions (used by backend)
│   ├── registry.yaml            # Index of all scripts and personas
│   ├── personas/
│   │   ├── alice.md             # Alice soul document
│   │   └── john.md              # John soul document
│   └── scripts/
│       └── salary_negotiation.yaml
│
├── assets/                      # Raw/reference assets (not used by code)
│   ├── personas/                # Original soul documents
│   ├── stories/                 # Pre-written dialogue scripts
│   └── worlds/                  # Background images
│
└── tests/                       # Python tests (pytest)
    ├── test_content_loader.py
    ├── test_context_manager.py
    ├── test_director.py
    └── test_engagement.py
```

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js)                  │
│                                                      │
│  VirtualRoom                                         │
│  ├─ ThreeCanvas → RoomManager                        │
│  │   ├─ TalkingHead: Alice ──→ /api/tts (Google TTS)│
│  │   └─ TalkingHead: John  ──→ /api/tts             │
│  ├─ ControlPanel                                     │
│  │   └─ RealtimeTranscriber ──→ /api/realtime-token  │
│  └─ Transcript                                       │
│                                                      │
└──────────┬───────────────────────────────────────────┘
           │ WebSocket /ws/session
           ▼
┌──────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                   │
│                                                      │
│  main.py                                             │
│  ├─ REST: /api/health, /api/scripts, /api/personas  │
│  └─ WebSocket → Director                            │
│      ├─ ContentLoader (content/)                     │
│      ├─ ContextManager → LLMClient (Anthropic API)  │
│      └─ Engagement (learner question scheduling)     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Backend Modules

### main.py — FastAPI Server
REST endpoints for health, scripts, and personas. WebSocket endpoint `/ws/session` handles full conversation lifecycle: accepts connection, waits for `start` message, spawns a Director, and relays messages between client and conversation loop.

### director.py — Conversation Orchestrator
State machine that drives multi-turn conversations. Each turn: checks user input, evaluates engagement triggers, executes an agent turn via ContextManager + LLMClient, records the turn, checks for phase advancement, and alternates speakers. Also handles learner interruptions and a terminal runner for CLI testing.

### context_manager.py — Prompt Assembly
Builds prompts using three layers:
1. **Cached system prompt** — persona soul document (cached via Anthropic prompt caching)
2. **Scene directive** — current phase context, emotional arc, territory, counterpart briefing, learner context
3. **Conversation history** — sliding window of last 8 turns + running summary of older turns (summarized by Claude Haiku every 10 turns)

### llm_client.py — Anthropic API Wrapper
Async wrapper around the Anthropic SDK. Supports prompt caching, exponential backoff retry for rate limits (429) and overload (529), and token usage tracking. Uses `claude-sonnet-4-5` for dialogue and `claude-haiku-4-5` for summaries/checks.

### content_loader.py — Content Management
Loads and validates personas (markdown) and scripts (YAML) from the `content/` directory using `registry.yaml` as the index. Parses required sections (Identity, Core Beliefs, Personality, Emotional Arc, Speech Patterns, Counterpart Briefing). Caches loaded content.

### engagement.py — Learner Engagement
Schedules moments where an agent turns to the learner and asks a question, breaking up lecture-style dialogue. 60% chance per eligible phase, with a 4-turn cooldown between engagements. Learner has 30 seconds to respond before the conversation continues.

### models.py — Data Models
Pydantic models: `PersonaData`, `ScriptData`, `PhaseConfig`, `PhasePersonaConfig`, `SessionState`, `Turn`.

## Frontend Modules

### VirtualRoom.tsx — Main Orchestrator
Manages all state: WebSocket connection, avatar room, transcriber, transcript history. Routes server messages to avatar speech and UI updates. Handles start/stop, mic toggle, and text input.

### ThreeCanvas.tsx — 3D Scene
Dynamically imports RoomManager (avoids SSR). Renders a full-screen div with `cool_office.png` background, initializes avatars on mount.

### room-manager.ts — Avatar Management
Uses TalkingHead library. Creates two avatar instances (Alice and John) sharing one Three.js scene. Manages a speech queue (one utterance at a time), positioning, and eye contact between avatars.

### ws-client.ts — WebSocket Client
`ConversationClient` class handling connection, heartbeat (30s ping), and message routing. Connects to `ws://localhost:8000/ws/session`.

### realtime-transcriber.ts — Speech-to-Text
Uses OpenAI Realtime API via WebSocket for real-time speech transcription. Fetches ephemeral token from `/api/realtime-token`, captures microphone audio at 24kHz via AudioWorklet, streams PCM16 to OpenAI, returns transcribed text.

### API Routes
- `/api/tts` — Proxies TTS requests to Google Cloud Text-to-Speech API
- `/api/realtime-token` — Mints ephemeral OpenAI Realtime API tokens with transcription config

## Content System

### Personas (Markdown)
Soul documents with required sections: Identity, Core Beliefs, Personality, Emotional Arc, Speech Patterns, Counterpart Briefing Template. The Counterpart Briefing is excluded from the persona's own system prompt and instead included in the other agent's scene directive.

### Scripts (YAML)
Define a conversation scenario with metadata, two personas, an opening speaker, learner context, phases (each with per-persona arc/territory/instruction/tone_example, min/max turns, engagement eligibility), and engagement question templates.

## External Services

| Service | Purpose | Used By |
|---------|---------|---------|
| Anthropic Claude API | Dialogue generation (Sonnet) + summaries/checks (Haiku) | Backend |
| Google Cloud TTS | Speech synthesis for avatars | Frontend (via `/api/tts`) |
| OpenAI Realtime API | Real-time speech transcription for learner input | Frontend (via `/api/realtime-token`) |

## WebSocket Protocol

**Client → Server:**
- `{action: "start", script_id: "..."}` — start conversation
- `{action: "speak", text: "..."}` — learner input
- `{action: "end"}` — end session
- `{action: "ping"}` — keepalive

**Server → Client:**
- `{type: "session_started", ...}` — session initialized
- `{type: "agent_turn", speaker, speaker_name, text}` — agent dialogue
- `{type: "engagement", speaker, text, awaiting_response}` — agent asks learner
- `{type: "phase_change", phase, phase_name}` — phase transition
- `{type: "session_ended", reason}` — conversation complete
- `{type: "error", message}` — error
- `{type: "pong"}` — keepalive response

## Key Constants

| Constant | Value | Description |
|----------|-------|-------------|
| PACING_DELAY | 2.0s | Pause between agent turns |
| SLIDING_WINDOW_SIZE | 8 turns | Recent context in prompt |
| SUMMARIZE_EVERY | 10 turns | Rolling summary interval |
| Engagement cooldown | 4 turns | Min gap between engagements |
| Learner timeout | 30s | Wait time for learner response |
| Max tokens per turn | 250 | LLM response limit |
| API retry | 3 attempts | Exponential backoff |
