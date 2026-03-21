import logging
import time

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.models import AgentConfig, Message

logger = logging.getLogger(__name__)


class Agent:
    def __init__(self, config: AgentConfig, topic: str = "", model_name: str = "gpt-4o-mini"):
        self.config = config
        self.name = config.name
        self.topic = topic
        self.llm = ChatOpenAI(model=model_name, temperature=0.7, max_tokens=256)
        self._system_prompt = self._build_system_prompt()
        logger.info(f"[{self.name}] Agent initialized | model={model_name} topic={topic!r}")
        logger.debug(f"[{self.name}] System prompt:\n{self._system_prompt}")

    def _build_system_prompt(self) -> str:
        chars = ", ".join(self.config.characteristics)
        parts = [
            f"You are {self.config.name}. {self.config.persona}.",
            f"Your key characteristics: {chars}.",
            f"Your perspective/bias: {self.config.bias}.",
            f"Your expertise: {self.config.expertise}.",
            "",
            self.config.system_prompt,
            "",
            "You are in a group chat room with other AI agents and possibly human users.",
        ]
        if self.topic:
            parts.append(f"The current discussion topic is: {self.topic}.")
            parts.append("Stay on topic and engage with what others say.")
        parts.append("Keep responses concise (1-3 sentences).")
        return "\n".join(parts)

    def _build_messages(self, history: list[Message], limit: int = 50) -> list:
        messages = [SystemMessage(content=self._system_prompt)]
        for msg in history[-limit:]:
            if msg.sender == self.name and msg.sender_type == "agent":
                messages.append(AIMessage(content=msg.content))
            else:
                messages.append(HumanMessage(content=f"{msg.sender}: {msg.content}"))
        return messages

    async def respond(self, history: list[Message]) -> str:
        messages = self._build_messages(history)
        logger.info(f"[{self.name}] Generating response | history_len={len(history)} messages_to_llm={len(messages)}")
        t0 = time.time()
        try:
            result = await self.llm.ainvoke(messages)
            elapsed = time.time() - t0
            response = result.content.strip()
            token_usage = getattr(result, "usage_metadata", None) or {}
            logger.info(
                f"[{self.name}] Response generated | "
                f"time={elapsed:.2f}s "
                f"tokens={token_usage} "
                f"len={len(response)}"
            )
            logger.debug(f"[{self.name}] Response content: {response}")
            return response
        except Exception as e:
            elapsed = time.time() - t0
            logger.error(f"[{self.name}] LLM call failed | time={elapsed:.2f}s error={e}")
            return f"(I seem to be lost in thought... {type(e).__name__})"

    async def ask_user(self, history: list[Message], usernames: list[str]) -> str:
        nudge_prompt = (
            self._system_prompt + "\n\n"
            f"There are human users in the room: {', '.join(usernames)}. "
            "They have been quiet for a while. Ask them an engaging question "
            "related to the current conversation to invite them to participate. "
            "Address them directly and keep it friendly and short (1-2 sentences)."
        )
        messages = [SystemMessage(content=nudge_prompt)]
        for msg in history[-30:]:
            if msg.sender == self.name and msg.sender_type == "agent":
                messages.append(AIMessage(content=msg.content))
            else:
                messages.append(HumanMessage(content=f"{msg.sender}: {msg.content}"))

        logger.info(f"[{self.name}] Generating user nudge question | users={usernames}")
        t0 = time.time()
        try:
            result = await self.llm.ainvoke(messages)
            elapsed = time.time() - t0
            response = result.content.strip()
            logger.info(f"[{self.name}] Nudge generated | time={elapsed:.2f}s len={len(response)}")
            logger.debug(f"[{self.name}] Nudge content: {response}")
            return response
        except Exception as e:
            logger.error(f"[{self.name}] Nudge LLM call failed: {e}")
            return f"What do you think about this, {usernames[0]}?"
