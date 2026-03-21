import time
from dataclasses import dataclass, field


@dataclass
class AgentConfig:
    name: str
    persona: str
    characteristics: list[str]
    bias: str
    expertise: str
    system_prompt: str


@dataclass
class Message:
    sender: str
    content: str
    sender_type: str  # "user" | "agent" | "system"
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "type": "message",
            "sender": self.sender,
            "content": self.content,
            "sender_type": self.sender_type,
            "timestamp": self.timestamp,
        }


@dataclass
class ScriptEntry:
    speaker: str
    content: str
    delay: float  # seconds to wait before delivering this line
    is_user_question: bool = False  # whether this line asks the user something
