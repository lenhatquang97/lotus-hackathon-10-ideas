import io
import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List
from openai import AsyncOpenAI
from app.core.config import settings
from app.api.v1.routes.auth import get_current_user

router = APIRouter()

_client = None


def get_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


MAX_EXTRACT_CHARS = 20_000  # ~5k tokens — keep context manageable


@router.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Extract plain text from an uploaded PDF, DOCX, or TXT file."""
    filename = (file.filename or "").lower()
    content = await file.read()

    if len(content) > 20 * 1024 * 1024:  # 20 MB hard cap
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    text = ""

    if filename.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(pages)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not parse PDF: {e}")

    elif filename.endswith(".docx"):
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not parse DOCX: {e}")

    elif filename.endswith(".txt") or filename.endswith(".md"):
        try:
            text = content.decode("utf-8", errors="replace")
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not decode text file: {e}")

    else:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload a PDF, DOCX, TXT, or MD file.",
        )

    text = text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="No readable text found in file.")

    # Truncate if needed and report
    truncated = len(text) > MAX_EXTRACT_CHARS
    text = text[:MAX_EXTRACT_CHARS]

    return {
        "text": text,
        "characters": len(text),
        "truncated": truncated,
        "filename": file.filename,
    }


class GenerateCharactersRequest(BaseModel):
    title: str
    description: str
    domain_knowledge: str
    num_characters: int  # 1–3
    cefr_levels: List[str] = ["B2"]
    tags: List[str] = []


class GenerateConversationRequest(BaseModel):
    title: str
    domain_knowledge: str
    characters: List[dict]


@router.post("/generate-characters")
async def generate_characters(
    data: GenerateCharactersRequest,
    current_user: dict = Depends(get_current_user),
):
    if not 1 <= data.num_characters <= 3:
        raise HTTPException(status_code=400, detail="num_characters must be 1–3")

    prompt = f"""You are a world designer for an English conversation practice platform.

Generate exactly {data.num_characters} distinct AI character(s) for this scenario.

Topic: {data.title}
Description: {data.description}
Background context (shared facts every character knows):
{data.domain_knowledge}

Learner CEFR level: {", ".join(data.cefr_levels)}
Tags / domain: {", ".join(data.tags) or "general"}

Requirements:
- Each character must have a genuinely different viewpoint or stake in the topic
- Make personas feel human — include quirks, speech patterns, and emotional tendencies
- bias_perception should reflect what this person BELIEVES or WANTS, creating productive tension for the learner
- Names should be realistic for the scenario's cultural context
- Keep persona and bias_perception to 2–3 concise sentences each

Respond ONLY with valid JSON:
{{
  "characters": [
    {{
      "name": "First name only",
      "role": "Their role or title in this scenario",
      "persona": "Personality, communication style, emotional tendencies",
      "bias_perception": "Their specific viewpoint, what they believe, their agenda or fear"
    }}
  ]
}}"""

    try:
        response = await get_client().chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1200,
            temperature=0.9,
        )
        result = json.loads(response.choices[0].message.content)
        characters = result.get("characters", [])[:data.num_characters]
        return {"characters": characters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Character generation failed: {e}")


@router.post("/generate-conversation")
async def generate_conversation(
    data: GenerateConversationRequest,
    current_user: dict = Depends(get_current_user),
):
    chars_desc = "\n".join(
        f"- {c['name']} ({c['role']}): {c.get('persona', '')} | Perspective: {c.get('bias_perception', '')}"
        for c in data.characters
    )
    char_names = [c["name"] for c in data.characters]
    num_turns = max(8, len(data.characters) * 5)

    prompt = f"""You are generating a sample conversation for an English practice scenario. \
This conversation will serve as in-context examples so the AI agents know how to behave.

Topic: {data.title}
Background: {data.domain_knowledge}

Characters:
{chars_desc}

Generate a realistic, engaging conversation (~{num_turns} exchanges) where a learner \
(speaker: "User") practices English with these characters. Show:
- Each character's distinct personality and perspective clearly
- Natural back-and-forth, including the User asking questions and making points
- Characters occasionally responding to each other, not just to the User
- Realistic disagreement and nuance — avoid characters being uniformly helpful

Speaker values: "User" or one of: {", ".join(char_names)}

Respond ONLY with valid JSON:
{{
  "conversation": [
    {{"speaker": "User" | character name, "text": "what they say"}}
  ]
}}"""

    try:
        response = await get_client().chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.85,
        )
        result = json.loads(response.choices[0].message.content)
        return {"conversation": result.get("conversation", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversation generation failed: {e}")
