import json
import logging
import time

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.agent import Agent
from app.models import Message, ScriptEntry

logger = logging.getLogger(__name__)

SCRIPT_SYSTEM_PROMPT = """\
You are a conversation script writer. You generate natural dialogue scripts \
for a group discussion between AI agents on a specific topic.

AGENTS IN THE ROOM:
{agent_descriptions}

TOPIC: {topic}

HUMAN USERS IN THE ROOM: {usernames}

RULES:
1. Generate a conversation script with exactly {num_entries} dialogue entries.
2. Each entry is one agent speaking 1-3 sentences.
3. Agents should debate, build on each other's points, agree/disagree naturally.
4. Each agent should speak from their unique persona, bias, and expertise.
5. Every 5-6 entries (roughly every 30 seconds), insert an entry where an agent \
asks the human user(s) a question related to the current discussion point. \
Mark these with "is_user_question": true.
6. If no natural question fits, the agent should ask the user for their opinion.
7. Set "delay" between 3-6 seconds per entry (simulates natural pacing).
8. Total script duration should be 30-60 seconds.
9. Build naturally on the previous conversation — do NOT repeat points already made.

PREVIOUS CONVERSATION (last messages for context):
{history_summary}

Return ONLY a valid JSON array. No markdown, no explanation. Example format:
[
  {{"speaker": "AgentName", "content": "What they say.", "delay": 4.0, "is_user_question": false}},
  {{"speaker": "AgentName", "content": "A question for the user?", "delay": 5.0, "is_user_question": true}}
]
"""


class ScriptGenerator:
    def __init__(self, model_name: str = "gpt-4o-mini"):
        self.llm = ChatOpenAI(model=model_name, temperature=0.8, max_tokens=2048)
        logger.info(f"ScriptGenerator initialized | model={model_name}")

    async def generate_script(
        self,
        agents: list[Agent],
        topic: str,
        history: list[Message],
        usernames: list[str],
        num_entries: int = 10,
    ) -> list[ScriptEntry]:
        agent_descriptions = "\n".join(
            f"- {a.name}: {a.config.persona}. Bias: {a.config.bias}. Expertise: {a.config.expertise}."
            for a in agents
        )
        history_summary = "\n".join(
            f"{m.sender}: {m.content}" for m in history[-20:]
        ) or "(No conversation yet — start fresh.)"

        user_list = ", ".join(usernames) if usernames else "(no users yet)"

        prompt = SCRIPT_SYSTEM_PROMPT.format(
            agent_descriptions=agent_descriptions,
            topic=topic or "Open discussion",
            usernames=user_list,
            history_summary=history_summary,
            num_entries=num_entries,
        )

        logger.info(
            f"Generating script | topic={topic!r} "
            f"agents={[a.name for a in agents]} "
            f"users={usernames} "
            f"history_len={len(history)} "
            f"num_entries={num_entries}"
        )
        logger.debug(f"Script prompt:\n{prompt}")

        t0 = time.time()
        try:
            result = await self.llm.ainvoke([
                SystemMessage(content=prompt),
                HumanMessage(content="Generate the next conversation script now."),
            ])
            elapsed = time.time() - t0
            raw = result.content.strip()
            token_usage = getattr(result, "usage_metadata", None) or {}

            logger.info(f"Script LLM response | time={elapsed:.2f}s tokens={token_usage} raw_len={len(raw)}")
            logger.debug(f"Script raw response:\n{raw}")

            entries = self._parse_script(raw, agents)
            self._log_script(entries)
            return entries
        except Exception as e:
            elapsed = time.time() - t0
            logger.error(f"Script generation failed | time={elapsed:.2f}s error={e}")
            entries = self._fallback_script(agents, usernames)
            self._log_script(entries, fallback=True)
            return entries

    def _log_script(self, entries: list[ScriptEntry], fallback: bool = False):
        label = "FALLBACK SCRIPT" if fallback else "SCRIPT"
        total_delay = sum(e.delay for e in entries)
        user_qs = sum(1 for e in entries if e.is_user_question)
        logger.info(
            f"[{label}] {len(entries)} entries | "
            f"~{total_delay:.0f}s duration | "
            f"{user_qs} user questions"
        )
        for i, entry in enumerate(entries):
            marker = " [USER Q]" if entry.is_user_question else ""
            logger.debug(
                f"  [{label} #{i+1}] {entry.speaker} (delay={entry.delay}s){marker}: "
                f"{entry.content[:100]}{'...' if len(entry.content) > 100 else ''}"
            )

    def _parse_script(self, raw: str, agents: list[Agent]) -> list[ScriptEntry]:
        # Strip markdown code fences if present
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)

        try:
            data = json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse script JSON: {e}")
            return self._fallback_script(agents, [])

        agent_names = {a.name for a in agents}
        entries = []
        for item in data:
            speaker = item.get("speaker", "")
            if speaker not in agent_names:
                matched = next((n for n in agent_names if n.lower() in speaker.lower()), None)
                if matched:
                    speaker = matched
                else:
                    speaker = agents[len(entries) % len(agents)].name

            entries.append(ScriptEntry(
                speaker=speaker,
                content=item.get("content", "..."),
                delay=float(item.get("delay", 4.0)),
                is_user_question=bool(item.get("is_user_question", False)),
            ))

        if not entries:
            return self._fallback_script(agents, [])
        return entries

    def _fallback_script(self, agents: list[Agent], usernames: list[str]) -> list[ScriptEntry]:
        """Simple alternating script when LLM generation fails."""
        entries = []
        for i, agent in enumerate(agents * 3):
            is_question = (i == 4)
            if is_question and usernames:
                content = f"What do you think about this, {usernames[0]}? We'd love to hear your perspective."
            else:
                content = f"That's an interesting point. Let me share my perspective on this."
            entries.append(ScriptEntry(
                speaker=agent.name,
                content=content,
                delay=4.0,
                is_user_question=is_question,
            ))
        return entries
