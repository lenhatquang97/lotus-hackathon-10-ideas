# Local Deployment

## Prerequisites

- Python 3.13+
- Node.js 18+
- API keys for: Anthropic, Google Cloud TTS, OpenAI

## 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   LLM_MODEL=claude-sonnet-4-5
#   LLM_MODEL_CHEAP=claude-haiku-4-5
#   HOST=0.0.0.0
#   PORT=8000
#   LOG_LEVEL=INFO
```

### Run the server

From the **project root** (not `backend/`):

```bash
python -m uvicorn backend.src.main:app --host 0.0.0.0 --port 8000 --reload
```

Or using the built-in runner:

```bash
python -c "from backend.src.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

The backend will be available at `http://localhost:8000`.

### Verify

```bash
curl http://localhost:8000/api/health
# {"status":"ok"}

curl http://localhost:8000/api/scripts
# [{"id":"salary_negotiation","file":"scripts/salary_negotiation.yaml",...}]
```

### CLI mode (no frontend needed)

```bash
python -m backend.src --script salary_negotiation
```

Runs an interactive terminal conversation for testing.

## 2. Frontend

```bash
cd frontend/src

# Install dependencies
npm install

# Configure environment
cp ../../frontend/.env.example ../../frontend/.env
# Edit frontend/.env and set your keys:
#   GOOGLE_TTS_API_KEY=your-google-tts-key
#   OPENAI_API_KEY=sk-...
#   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/session  (optional, this is the default)
```

### Run the dev server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## 3. Run Tests

From the **project root**:

```bash
pytest tests/ -v
```

## Full Stack Checklist

1. Backend running on `http://localhost:8000`
2. Frontend running on `http://localhost:3000`
3. Open `http://localhost:3000` in a browser
4. Click Start — avatars will begin their conversation
5. Use the microphone button or text input to participate when prompted

## API Keys

| Key | Where to get it | Used for |
|-----|----------------|----------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | AI dialogue generation |
| `GOOGLE_TTS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — enable "Cloud Text-to-Speech API" | Avatar speech synthesis |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Real-time speech transcription |

## Ports

| Service | Port | URL |
|---------|------|-----|
| Backend | 8000 | `http://localhost:8000` |
| Frontend | 3000 | `http://localhost:3000` |
| WebSocket | 8000 | `ws://localhost:8000/ws/session` |
