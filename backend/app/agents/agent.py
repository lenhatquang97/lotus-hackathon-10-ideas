from openai import AsyncOpenAI
from app.core.config import settings

_client = None


def get_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


class ConversationAgent:
    def __init__(self, character: dict, topic: dict, learner_cefr: str = "B2"):
        self.character = character
        self.topic = topic
        self.learner_cefr = learner_cefr
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        return f"""You are {self.character['name']}, {self.character['role']}.

Scenario context:
{self.topic.get('domain_knowledge', '')}

Your persona: {self.character.get('persona', '')}
Your perspective/bias: {self.character.get('bias_perception', '')}
Conversation topic: {self.topic.get('title', '')}

Respond naturally in English. Stay in character. Keep responses concise (2-4 sentences).
Target vocabulary level: {self.learner_cefr}. Do NOT acknowledge you are an AI.
Engage the learner meaningfully. Ask follow-up questions when appropriate."""

    async def generate_response(self, conversation_history: list) -> str:
        messages = [
            {"role": "system", "content": self.system_prompt}
        ] + conversation_history
        try:
            client = get_client()
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=200,
                temperature=0.8,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM error: {e}")
            return "I see. Could you tell me more about that?"
