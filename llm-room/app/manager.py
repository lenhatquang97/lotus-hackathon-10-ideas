import logging
from pathlib import Path

import yaml

from app.agent import Agent
from app.models import AgentConfig
from app.room import Room

logger = logging.getLogger(__name__)


def load_agent_configs(path: str | Path = "agents.yaml") -> list[AgentConfig]:
    with open(path) as f:
        data = yaml.safe_load(f)
    return [AgentConfig(**a) for a in data["agents"]]


def topic_doc_to_agent_configs(topic_doc: dict) -> list[AgentConfig]:
    """Convert a MongoDB conversation_topics document into AgentConfig list."""
    domain = topic_doc.get("domain_knowledge", "")
    description = topic_doc.get("description", "")
    configs = []
    for char in topic_doc.get("characters", []):
        configs.append(AgentConfig(
            name=char["name"],
            persona=char.get("persona", ""),
            characteristics=[char.get("role", "participant")],
            bias=char.get("bias_perception", ""),
            expertise=domain,
            system_prompt=description,
        ))
    return configs


class RoomManager:
    def __init__(self, agent_configs: list[AgentConfig] | None = None):
        self.rooms: dict[str, Room] = {}
        self.agent_configs = {c.name: c for c in (agent_configs or [])}

    def create_room(self, room_id: str, agent_names: list[str], topic: str = "") -> Room:
        agents = []
        for name in agent_names:
            if name in self.agent_configs:
                agents.append(Agent(self.agent_configs[name], topic=topic))
        room = Room(room_id=room_id, agents=agents, topic=topic)
        self.rooms[room_id] = room
        return room

    def create_room_from_topic(self, topic_doc: dict) -> Room:
        """Create a room from a MongoDB conversation_topics document."""
        topic_id = topic_doc.get("id", topic_doc.get("_id", "unknown"))
        room_id = f"topic-{topic_id}"

        # If room already exists for this topic, return it
        if room_id in self.rooms:
            logger.info(f"Room already exists for topic {topic_id}")
            return self.rooms[room_id]

        configs = topic_doc_to_agent_configs(topic_doc)
        topic_title = topic_doc.get("title", "")
        agents = [Agent(config, topic=topic_title) for config in configs]

        room = Room(room_id=room_id, agents=agents, topic=topic_title)
        self.rooms[room_id] = room
        logger.info(
            f"Created room from topic | room={room_id} "
            f"topic={topic_title!r} agents={[a.name for a in agents]}"
        )
        return room

    def get_room(self, room_id: str) -> Room | None:
        return self.rooms.get(room_id)

    def list_rooms(self) -> list[dict]:
        return [
            {
                "room_id": r.room_id,
                "topic": r.topic,
                "agents": [a.name for a in r.agents],
                "user_count": r.user_count,
            }
            for r in self.rooms.values()
        ]
