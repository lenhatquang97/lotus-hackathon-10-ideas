from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.api.v1.routes.auth import get_current_user

router = APIRouter()

WORLD_GENERATION_PROMPT = """You are a world-building AI for an English language learning platform. Given a user's prompt describing a scenario, generate a complete world configuration for immersive English conversation practice.

Output ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "title": "string - compelling, descriptive title (5-8 words)",
  "description": "string - 2-3 sentence description of the scenario and what the learner will practice",
  "domain_knowledge": "string - 2-3 sentences setting the scene for the learner, written in second person",
  "difficulty_levels": ["string - one of: Beginner, Intermediate, Advanced"],
  "tags": ["string array of 2-3 topic tags like 'workplace', 'negotiation', 'travel'"],
  "characters": [
    {
      "name": "string - full realistic name",
      "role": "string - one of: Anchor, Challenger, Observer",
      "persona": "string - 2-3 sentences describing personality traits, communication style, and professional background",
      "bias_perception": "string - what this character tends to believe or advocate for in this scenario"
    }
  ],
  "vocabulary": [
    {
      "word": "string - a challenging English word relevant to this scenario",
      "definition": "string - short, clear definition (5-10 words)"
    }
  ]
}

Rules:
- Generate 2-3 characters with distinct personalities and roles
- Exactly ONE character must have role "Anchor" (drives the main conversation)
- Characters should have natural disagreements or different perspectives
- The scenario must create opportunities for the learner to practice initiative, not just respond
- Character names must be realistic full names (first + last)
- Each character's persona must include their profession, age range, and communication style
- Tags should be lowercase single words
- Generate 8-15 vocabulary words that are challenging but useful for this scenario
- Vocabulary words should be domain-specific terms the learner is likely to encounter in this conversation"""

DIFFICULTY_CEFR = {
    "beginner": "A2",
    "intermediate": "B1",
    "advanced": "C1",
}


class GenerateRequest(BaseModel):
    brief: str
    difficulty: str = "intermediate"
    knowledge_items: Optional[List[str]] = None


class GeneratedCharacter(BaseModel):
    name: str
    role: str
    persona: str
    bias_perception: str = ""


class GeneratedVocabItem(BaseModel):
    word: str
    definition: str


class GeneratedWorld(BaseModel):
    title: str
    description: str
    domain_knowledge: str
    difficulty_levels: List[str]
    tags: List[str]
    characters: List[GeneratedCharacter]
    vocabulary: List[GeneratedVocabItem] = []


@router.post("/generate-world", response_model=GeneratedWorld)
async def generate_world(
    data: GenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    if len(data.brief.strip()) < 10:
        raise HTTPException(status_code=400, detail="Brief must be at least 10 characters")

    cefr = DIFFICULTY_CEFR.get(data.difficulty, "B1")
    system_prompt = WORLD_GENERATION_PROMPT + f"\n\nIMPORTANT: Target CEFR level {cefr} for this world."

    user_message = data.brief
    if data.knowledge_items:
        user_message += "\n\nAdditional context:\n" + "\n".join(
            f"- {item}" for item in data.knowledge_items if item.strip()
        )

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.8,
            max_tokens=2000,
        )

        content = completion.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="No response from AI")

        # Clean markdown fences if present
        cleaned = content.replace("```json", "").replace("```", "").strip()

        import json
        parsed = json.loads(cleaned)

        # Validate and build response
        characters = []
        for c in parsed.get("characters", []):
            characters.append(GeneratedCharacter(
                name=c.get("name", "Unknown"),
                role=c.get("role", "Anchor"),
                persona=c.get("persona", ""),
                bias_perception=c.get("bias_perception", ""),
            ))

        if not characters:
            raise HTTPException(status_code=500, detail="AI did not generate any characters")

        vocabulary = []
        for v in parsed.get("vocabulary", []):
            vocabulary.append(GeneratedVocabItem(
                word=v.get("word", ""),
                definition=v.get("definition", ""),
            ))

        return GeneratedWorld(
            title=parsed.get("title", "Untitled World"),
            description=parsed.get("description", ""),
            domain_knowledge=parsed.get("domain_knowledge", parsed.get("scenarioContext", "")),
            difficulty_levels=parsed.get("difficulty_levels", [data.difficulty.capitalize()]),
            tags=parsed.get("tags", []),
            characters=characters,
            vocabulary=vocabulary,
        )

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
