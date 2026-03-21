# Project: Multi-Persona Conversational Learning Platform (MVP)

## What This Is
A Python backend that orchestrates three-party conversations: two AI personas talk to each other on a scripted topic while a human learner observes, interrupts, and gets asked questions. Think of it as an interactive English/communication skills practice room.

## Tech Stack — STRICTLY ENFORCED
- Python 3.12+
- FastAPI + uvicorn
- `anthropic` Python SDK for ALL LLM calls
- pydantic v2 for data models
- pyyaml for script parsing
- pytest + pytest-asyncio for tests
- python-dotenv for env vars

## FORBIDDEN — Do NOT Use
- LangChain, LangGraph, LlamaIndex, CrewAI, AutoGen, or ANY orchestration framework
- Any LLM wrapper library other than the official `anthropic` SDK
- Any database — all state is in-memory per session
- Any message queue — direct async/await only
- localStorage or browser APIs

## Critical Architecture Rules

### 1. One Persona Per System Prompt
NEVER put two persona soul documents in one API call. Each agent call has exactly ONE soul document as its system prompt. The other character is represented only by a brief counterpart briefing (~80 tokens) in the user message.

### 2. Prompt Caching Is Mandatory
Soul documents go in the `system` parameter with `cache_control: {"type": "ephemeral"}`. Use auto-caching on the top-level request for the growing message history. This cuts costs by 90% on repeated content.

### 3. Scripts Are Soft Guidance
The script YAML defines phases, territory, and emotional arcs. Agents should paraphrase and improvise within these bounds — NOT recite script lines. The `tone_example` field is inspiration, not a template.

### 4. Director Pattern, Not Agent Framework
The Director is a Python async state machine. It decides who speaks, assembles prompts, calls the API, and manages state. It is NOT an LLM agent — it's deterministic code that orchestrates LLM calls.

## Content Structure
```
content/
├── registry.yaml              # Index of all personas and scripts
├── personas/*.md              # Soul documents (markdown)
└── scripts/*.yaml             # Conversation scripts (YAML)
```

## Implementation Plan
**Read IMPLEMENTATION_PLAN.md for the complete specification.** It contains:
- Exact data models (Section 3)
- Module specs with function signatures (Section 5)
- Prompt templates that must be implemented verbatim (Section 7)
- Implementation order that MUST be followed (Section 6)
- Testing requirements (Section 9)

## Implementation Order — Follow Exactly
1. `models.py` + `content_loader.py` → test content parsing
2. `llm_client.py` → test API calls + caching
3. `context_manager.py` → test prompt assembly
4. `director.py` (basic) → **TWO-AGENT CONVERSATION WITH NO USER INPUT** ← This is the proof-of-concept gate. Run it, read the output, evaluate quality. If it doesn't sound like two distinct characters having a real conversation, STOP and fix prompts before proceeding.
5. `engagement.py` + update director → random learner questions
6. Director + user interruption handling
7. `main.py` WebSocket server
8. REST API endpoints

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...     # Required
LLM_MODEL=claude-sonnet-4-5-20250514
LLM_MODEL_CHEAP=claude-haiku-4-5-20251001
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

## Testing
```bash
# Unit tests (no API key needed)
pytest tests/ -k "not integration" -v

# Integration tests (needs ANTHROPIC_API_KEY)
pytest tests/test_integration.py -v

# Run a full conversation in terminal (Step 4 proof-of-concept)
python -m src.director --script salary_negotiation --no-websocket
```

## Key Model Parameters
- Persona turns: `max_tokens=250`, model=Sonnet 4.5
- Phase transition checks: `max_tokens=10`, model=Haiku 4.5
- Summarization: `max_tokens=150`, model=Haiku 4.5
- Temperature: Use defaults (do not set explicitly)

## WebSocket Protocol
Client → Server: `{"action": "start"|"speak"|"end", ...}`
Server → Client: `{"type": "agent_turn"|"engagement"|"phase_change"|"session_started"|"session_ended"|"error", ...}`
See Section 4.3 of IMPLEMENTATION_PLAN.md for full schema.
