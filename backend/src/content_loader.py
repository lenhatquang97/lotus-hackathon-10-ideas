"""Content loading and validation for personas and scripts."""

import re
from pathlib import Path

import yaml

from .models import PersonaData, PhaseConfig, PhasePersonaConfig, ScriptData


CONTENT_DIR = Path(__file__).parent.parent.parent / "content"

REQUIRED_PERSONA_SECTIONS = [
    "Identity",
    "Core Beliefs",
    "Personality",
    "Emotional Arc",
    "Speech Patterns",
    "Counterpart Briefing Template",
]


class ContentLoader:
    def __init__(self, content_dir: Path | None = None):
        self.content_dir = content_dir or CONTENT_DIR
        self._persona_cache: dict[str, PersonaData] = {}
        self._script_cache: dict[str, ScriptData] = {}
        self.registry = self._load_registry()

    def _load_registry(self) -> dict:
        registry_path = self.content_dir / "registry.yaml"
        if not registry_path.exists():
            raise FileNotFoundError(f"Registry not found: {registry_path}")
        with open(registry_path) as f:
            return yaml.safe_load(f)

    def _parse_sections(self, markdown: str) -> dict[str, str]:
        """Split markdown on ## headers into a dict of section_name -> content."""
        sections: dict[str, str] = {}
        # Split on ## but keep the header
        parts = re.split(r'\n## ', markdown)
        for part in parts[1:]:  # skip everything before the first ##
            lines = part.split('\n', 1)
            header = lines[0].strip()
            # Remove trailing --- separators from section names
            header = header.rstrip('-').strip()
            body = lines[1].strip() if len(lines) > 1 else ""
            # Strip trailing --- separator lines from body
            body = re.sub(r'\n---\s*$', '', body).strip()
            sections[header] = body
        return sections

    def _parse_emotional_arc(self, arc_text: str) -> list[str]:
        """Parse numbered items from the Emotional Arc section."""
        items = []
        # Match numbered items like "1. **Opens warm and confident.** ..."
        pattern = r'\d+\.\s+\*\*(.+?)\*\*'
        for match in re.finditer(pattern, arc_text):
            items.append(match.group(1).rstrip('.'))
        return items

    def _extract_name_and_role(self, sections: dict[str, str]) -> tuple[str, str]:
        """Extract name and role from the Identity section."""
        identity = sections.get("Identity", "")
        name_match = re.search(r'\*\*Full Name:\*\*\s*(.+)', identity)
        role_match = re.search(r'\*\*Role:\*\*\s*(.+)', identity)
        name = name_match.group(1).strip() if name_match else "Unknown"
        role = role_match.group(1).strip() if role_match else "Unknown"
        return name, role

    def load_persona(self, persona_id: str) -> PersonaData:
        """Load and parse a persona soul document by ID."""
        if persona_id in self._persona_cache:
            return self._persona_cache[persona_id]

        # Find file path from registry
        persona_entry = None
        for p in self.registry.get("personas", []):
            if p["id"] == persona_id:
                persona_entry = p
                break
        if not persona_entry:
            raise ValueError(f"Persona '{persona_id}' not found in registry")

        filepath = self.content_dir / persona_entry["file"]
        if not filepath.exists():
            raise FileNotFoundError(f"Persona file not found: {filepath}")

        markdown = filepath.read_text()
        sections = self._parse_sections(markdown)

        # Validate required sections
        for section in REQUIRED_PERSONA_SECTIONS:
            # Check for partial match since some sections have suffixes
            found = any(section.lower() in key.lower() for key in sections)
            if not found:
                raise ValueError(
                    f"Persona '{persona_id}' missing required section: '{section}'"
                )

        # Extract counterpart briefing (excluded from soul document system prompt)
        counterpart_briefing = ""
        for key in list(sections.keys()):
            if "counterpart briefing" in key.lower():
                counterpart_briefing = sections[key]
                break

        # Build soul document: full markdown minus the counterpart briefing section
        soul_lines = []
        in_counterpart = False
        for line in markdown.split('\n'):
            if re.match(r'^## Counterpart Briefing', line, re.IGNORECASE):
                in_counterpart = True
                continue
            if in_counterpart and re.match(r'^## ', line):
                in_counterpart = False
            if in_counterpart:
                continue
            soul_lines.append(line)
        soul_document = '\n'.join(soul_lines).strip()

        # Parse emotional arc
        arc_section = ""
        for key, value in sections.items():
            if "emotional arc" in key.lower():
                arc_section = value
                break
        emotional_arc = self._parse_emotional_arc(arc_section)

        name, _ = self._extract_name_and_role(sections)

        persona = PersonaData(
            id=persona_id,
            name=persona_entry.get("name", name),
            soul_document=soul_document,
            counterpart_briefing=counterpart_briefing,
            emotional_arc=emotional_arc,
        )
        self._persona_cache[persona_id] = persona
        return persona

    def load_script(self, script_id: str) -> ScriptData:
        """Load and parse a conversation script by ID."""
        if script_id in self._script_cache:
            return self._script_cache[script_id]

        # Find script in registry
        script_entry = None
        for s in self.registry.get("scripts", []):
            if s["id"] == script_id:
                script_entry = s
                break
        if not script_entry:
            raise ValueError(f"Script '{script_id}' not found in registry")

        filepath = self.content_dir / script_entry["file"]
        if not filepath.exists():
            raise FileNotFoundError(f"Script file not found: {filepath}")

        with open(filepath) as f:
            data = yaml.safe_load(f)

        # Load personas referenced by the script
        persona_a_id = data["personas"]["persona_a"]["id"]
        persona_b_id = data["personas"]["persona_b"]["id"]
        persona_a = self.load_persona(persona_a_id)
        persona_b = self.load_persona(persona_b_id)

        # Parse phases
        phases = []
        for phase_data in data["phases"]:
            phase = PhaseConfig(
                id=phase_data["id"],
                name=phase_data["name"],
                description=phase_data["description"],
                persona_a=PhasePersonaConfig(
                    arc=phase_data["persona_a"]["arc"],
                    territory=phase_data["persona_a"]["territory"],
                    instruction=phase_data["persona_a"]["instruction"],
                    tone_example=phase_data["persona_a"]["tone_example"].strip(),
                ),
                persona_b=PhasePersonaConfig(
                    arc=phase_data["persona_b"]["arc"],
                    territory=phase_data["persona_b"]["territory"],
                    instruction=phase_data["persona_b"]["instruction"],
                    tone_example=phase_data["persona_b"]["tone_example"].strip(),
                ),
                min_turns=phase_data["min_turns"],
                max_turns=phase_data["max_turns"],
                engagement_eligible=phase_data["engagement_eligible"],
            )
            phases.append(phase)

        # Map opening_speaker name to persona_a/persona_b
        opening_speaker_name = data.get("opening_speaker", "")
        if opening_speaker_name == persona_a_id:
            opening_speaker = "persona_a"
        elif opening_speaker_name == persona_b_id:
            opening_speaker = "persona_b"
        else:
            opening_speaker = "persona_a"

        # Parse engagement templates
        templates = data.get("engagement_templates", {})

        script = ScriptData(
            id=data["metadata"]["id"],
            title=data["metadata"]["title"],
            description=data["metadata"]["description"],
            persona_a=persona_a,
            persona_b=persona_b,
            opening_speaker=opening_speaker,
            learner_context=data.get("learner_context", "").strip(),
            phases=phases,
            engagement_templates_a=templates.get("persona_a_asks", []),
            engagement_templates_b=templates.get("persona_b_asks", []),
        )
        self._script_cache[script_id] = script
        return script

    def list_scripts(self) -> list[dict]:
        """Return metadata for all available scripts."""
        return self.registry.get("scripts", [])

    def list_personas(self) -> list[dict]:
        """Return metadata for all available personas."""
        return self.registry.get("personas", [])

    def validate_all(self) -> None:
        """Load and validate all registered content. Raises on first error."""
        for script_entry in self.registry.get("scripts", []):
            self.load_script(script_entry["id"])
