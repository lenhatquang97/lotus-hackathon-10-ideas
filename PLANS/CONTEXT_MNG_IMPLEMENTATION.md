# IMPLEMENTATION PLAN: Multi-Persona Conversational Learning Platform

## For: Claude Code CLI Implementation
## Status: MVP Specification
## Date: 2026-03-21

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Feasibility Assessment](#2-feasibility-assessment)
3. [Data Model & Content Schema](#3-data-model--content-schema)
4. [Architecture](#4-architecture)
5. [Module Specifications](#5-module-specifications)
6. [Implementation Order](#6-implementation-order)
7. [Prompt Engineering Specifications](#7-prompt-engineering-specifications)
8. [API & Cost Strategy](#8-api--cost-strategy)
9. [Testing Strategy](#9-testing-strategy)
10. [File Structure](#10-file-structure)
11. [Key Risks & Mitigations](#11-key-risks--mitigations)

---

## 1. PROJECT OVERVIEW

### What This System Does

A backend Python service that orchestrates real-time three-party conversations: two AI personas talk to each other on a scripted topic while a human learner observes and can interrupt at any time. The AI personas occasionally ask the learner for their opinion.

### Core Constraints

- **Generic**: Supports N personas and M scripted conversations, not hardcoded to any single scenario.
- **Soul-Driven**: Each persona is defined by a "soul document" — a rich character profile that drives all their behavior. Scripts are soft guidance, not rigid tracks.
- **MVP-First**: No over-engineering. Prove the concept works before optimizing.
- **Backend Only**: Python. The frontend, TTS, and STT are handled separately. This system accepts text input and produces text output over WebSocket.

### Scale Targets for MVP

- 10 persona soul documents
- 5-10 scripted conversation outlines
- Each script involves exactly 2 personas from the pool
- Concurrent users: 1-5 for MVP (single server)

---

## 2. FEASIBILITY ASSESSMENT

### API Rate Limits (Anthropic Claude)

Based on current Anthropic rate limit documentation (March 2026):

| Tier | Deposit | RPM | ITPM (Sonnet) | OTPM |
|------|---------|-----|---------------|------|
| Tier 1 | $5 | 50 | 30,000 | 8,000 |
| Tier 2 | $40 | 1,000 | 400,000 | 80,000 |
| Tier 3 | $200 | 2,000 | 800,000 | 160,000 |
| Tier 4 | $400 | 4,000 | 2,000,000 | 400,000 |

**Critical: Cached input tokens do NOT count toward ITPM limits on most current models.** This means with high cache hit rates, effective throughput is much higher.

**Feasibility verdict**: A single session generates ~1 API call every 3-5 seconds (for turn-taking pace). That's 12-20 RPM per session. At Tier 2 (50 RPM), you can run 2-3 concurrent sessions. At Tier 3, effectively unlimited for MVP scale.

### Cost Per Session

Using Claude Sonnet 4.5 ($3/$15 per MTok) with prompt caching:

- Soul document (cached after first call): ~2,000-3,000 tokens, read at $0.30/MTok
- Fresh context per call: ~1,500-2,500 tokens at $3/MTok
- Output per turn: ~80-150 tokens at $15/MTok
- ~30 agent turns per session

**Estimated cost: $0.20-0.30 per full session.** Viable at any scale.

### Model Selection

| Component | Model | Reason |
|-----------|-------|--------|
| Persona agents (John, Alice, etc.) | Claude Sonnet 4.5 | Fast, cheap, excellent at role-play and persona consistency |
| Phase transition detection | Claude Haiku 4.5 | Ultra-cheap classification call, ~$0.001 per check |
| Conversation summarization | Claude Haiku 4.5 | Cheap utility, runs every ~10 turns |

### Prompt Caching Feasibility

- Minimum cacheable tokens for Sonnet 4.5: **1,024 tokens**
- Soul documents range 2,000-3,500 tokens: **always cacheable**
- Cache TTL: 5 minutes (default), refreshes on each hit
- Within a session, calls happen every 3-5 seconds: **cache stays warm permanently**
- Cache read cost: 10% of base input price

**Conclusion: Fully feasible. Cost-effective. Rate limits are not a blocker for MVP.**

---

## 3. DATA MODEL & CONTENT SCHEMA

### 3.1 Persona Soul Document Format

All persona files live in `content/personas/` as markdown files. The filename (minus extension) is the persona ID.

**Required sections in every soul document** (Claude Code must validate these exist):

```markdown
# SOUL DOCUMENT — {CHARACTER_NAME}

## Identity
- Full Name
- Role
- Experience Level

## Who {Name} Is
(Narrative description of the character)

## Professional DNA
(Skills, capabilities, domain expertise)

## Core Beliefs
(2-4 beliefs that drive their arguments and decisions)

## Personality
(Behavioral traits, how they present themselves)

## Emotional Arc (For Performance)
(Numbered list of 3-6 emotional phases the character goes through
in a typical conversation on their topic. This is what the Director
uses to track which phase the character is in.)

## Speech Patterns
(How they talk — sentence length, verbal tics, tone shifts)

## Counterpart Briefing Template
(A 2-3 sentence summary of this character written for the OTHER
persona to read. Tells the other character who they're talking to.)
```

**IMPORTANT**: The `## Emotional Arc` section must use numbered items. The Director parses these to create phase definitions. Each numbered item becomes one phase.

**IMPORTANT**: The `## Counterpart Briefing Template` is a new section the content team must add. It's a compact description (~80 tokens) of this character written from a third-person perspective, designed to be injected into the OTHER character's prompt so they know who they're talking to without needing the full soul document.

Example for John:
```markdown
## Counterpart Briefing Template
John is a mid-level Marketing Specialist who reports to you. Reliable,
consistent, and passionate but measured. He built the organic growth
engine that drove exceptional results. He's earned the right to this
conversation and he knows it — but he won't be aggressive about it.
He gets quieter when serious, not louder.
```

### 3.2 Scripted Conversation Format

All scripts live in `content/scripts/` as YAML files. NOT markdown — YAML gives us structured data the Director can parse without ambiguity.

**File naming**: `{script_id}.yaml` (e.g., `salary_negotiation.yaml`)

```yaml
# content/scripts/salary_negotiation.yaml

metadata:
  id: "salary_negotiation"
  title: "Salary Negotiation"
  description: "An employee makes the case for a raise to their manager."
  topic_category: "workplace"  # for future filtering/grouping
  estimated_duration_minutes: 8
  difficulty: "intermediate"  # beginner, intermediate, advanced

personas:
  persona_a:
    id: "john"                    # matches filename in content/personas/
    role_in_scene: "employee"     # contextual role for this specific script
  persona_b:
    id: "alice"
    role_in_scene: "manager"

opening_speaker: "john"           # who speaks first

# The learner context tells agents who the third person in the room is
learner_context: >
  A Learner is present in the room, observing this conversation.
  They are practicing English and communication skills.
  When the Learner speaks, respond to them naturally and in character,
  as you would a colleague who happened to be sitting in.
  Keep your response to them brief (1-2 sentences), then continue
  the conversation.

phases:
  - id: 1
    name: "the_opening"
    description: "Initial pitch and first reactions"
    persona_a:
      arc: "Opens warm and confident — genuine excitement about results"
      territory:
        - "Present the headline results (20x organic growth)"
        - "Claim ownership of the referral framework and content strategy"
      instruction: "Lead with your results. You're excited. This is your moment."
      tone_example: >
        Alice, got a minute? I pulled up our Q3 numbers and...
        we 20x'd our organic leads. Twenty. Times.
    persona_b:
      arc: "Relaxed and slightly amused — she's heard this pitch before"
      territory:
        - "Acknowledge the numbers but challenge attribution"
        - "Test his resolve with humor"
      instruction: "Give him the floor, then poke holes. Use dry humor. You're testing, not attacking."
      tone_example: >
        Oh yeah, great numbers. But you said it yourself — 'organic.'
        That means people came to us on their own. What exactly did
        you do... besides exist?
    min_turns: 3
    max_turns: 6
    engagement_eligible: true     # can the Director trigger a learner question here?

  - id: 2
    name: "the_pushback"
    description: "Data exchange and strategic arguments"
    persona_a:
      arc: "Turns strategic under resistance — calm, precise, data-driven"
      territory:
        - "Cost-per-lead comparison: $42 paid vs $3 organic"
        - "Ambassador program: 42 advocates onboarded"
        - "800 qualified leads in one quarter"
      instruction: "Switch to data mode. You've done your homework. Be precise."
      tone_example: >
        Before the referral program, we were spending $14K/month on
        paid ads. Cost per lead — $42. My organic strategy? Under $3.
        That's a 93% reduction.
    persona_b:
      arc: "Deflects with logic and humor — the wall is polite but solid"
      territory:
        - "Budget constraints are real"
        - "Doing a good job is the expectation, not grounds for a raise"
        - "Good quarter vs sustainable performance"
      instruction: "Acknowledge the data — it's strong. But hold the line. Use the coffee machine analogy."
      tone_example: >
        The numbers are solid. I'll give you that. But a strategy
        working doesn't automatically mean a raise. The coffee machine
        works. I'm not giving it a bonus.
    min_turns: 4
    max_turns: 8
    engagement_eligible: true

  - id: 3
    name: "the_wall"
    description: "Frustration builds as logic hits corporate reality"
    persona_a:
      arc: "Grows frustrated when logic is dismissed — controlled disappointment"
      territory:
        - "Industry benchmark: 15% QoQ growth vs 1900%"
        - "Three consecutive quarters of acceleration"
        - "This isn't a fluke — it's a pattern"
      instruction: "Push harder with industry data. Your frustration should show in shorter sentences and longer pauses, not in volume."
      tone_example: >
        Alice, with all due respect, I benchmarked this. Average
        organic growth in our sector is 15% quarter over quarter.
        We didn't do 15%. We did 1,900%.
    persona_b:
      arc: "Increasingly firm — warmth drains, professionalism hardens"
      territory:
        - "Budget doesn't support it right now"
        - "Timing matters, not just results"
        - "Can't set precedent of raise-per-good-quarter"
      instruction: "Your sentences get shorter. Pauses get longer. The politeness stays but the warmth is gone."
      tone_example: >
        John. I hear you. But the answer right now is: the budget
        doesn't support it. It's not personal.
    min_turns: 3
    max_turns: 6
    engagement_eligible: true

  - id: 4
    name: "the_vulnerability"
    description: "Loyalty and personal stakes enter the conversation"
    persona_a:
      arc: "Becomes vulnerable — drops the pitch, speaks from the heart"
      territory:
        - "Recruiters reached out — he didn't respond"
        - "He chose to stay out of loyalty"
        - "Loyalty should be a two-way street"
      instruction: "This is where you stop arguing data and speak as a person. Your voice gets quieter. Ask permission before being vulnerable."
      tone_example: >
        Can I be honest with you? I had two recruiters reach out
        last month. I didn't respond. Because I actually like working
        here. But I need to feel like that loyalty is a two-way street.
    persona_b:
      arc: "Flinches when loyalty is invoked — then recovers and holds the line"
      territory:
        - "Can't make decisions based on outside offers"
        - "Not right now doesn't mean not ever"
        - "Internal: she remembers being on the other side"
      instruction: "The loyalty point hits home — let it land for half a beat before you recover. Your 'not right now' is genuine."
      tone_example: >
        I appreciate your loyalty. And I don't want you to feel
        undervalued. But I can't make decisions based on outside
        offers. That sets a bad precedent.
    min_turns: 4
    max_turns: 8
    engagement_eligible: true

  - id: 5
    name: "the_resolution"
    description: "Final positions, dignified standoff, exit"
    persona_a:
      arc: "Dignified resolve — not defeated, just recalibrating"
      territory:
        - "He'll be back next quarter"
        - "He remembers this conversation"
        - "For the record — he's worth it"
      instruction: "Stand. Be professional. Make it clear this isn't over without threatening. Leave something in the room."
      tone_example: >
        I respect your position, Alice. But I want you to know —
        I remember this conversation. And next quarter, I'm going
        to be sitting right back in this chair.
    persona_b:
      arc: "Holds the line — but the cost shows after he leaves"
      territory:
        - "Expects nothing less from him"
        - "Internal monologue: she knows she might lose him"
      instruction: "Let him go with respect. After he leaves, the mask slips. One quiet line to yourself."
      tone_example: >
        I wouldn't expect anything less.
        (after he leaves, to herself) ...Yeah. That's what worries me.
    min_turns: 2
    max_turns: 4
    engagement_eligible: false    # don't interrupt the emotional climax

# Engagement question templates — the Director picks from these
# when it decides to trigger a learner engagement in a given phase.
# {persona_a} and {persona_b} get replaced with actual names.
engagement_templates:
  persona_a_asks:
    - "What do you think? If you delivered these numbers, would you just accept 'not right now'?"
    - "Be honest — does my case hold up? What would you add?"
    - "If you were in my position, how would you push back on the budget argument?"
    - "Do you think bringing up the recruiter thing was smart, or did that hurt my case?"
  persona_b_asks:
    - "What would YOU do if every good quarter meant a raise request? How would you manage that?"
    - "Do you think he's made a case that would survive a board presentation?"
    - "Am I being unreasonable? Or am I doing what any manager in my position would do?"
    - "If you were running this department's budget, would you approve this raise?"
```

### 3.3 Content Registry

A single `content/registry.yaml` file indexes all available content:

```yaml
# content/registry.yaml
# Auto-generated or manually maintained — lists what's available

personas:
  - id: "john"
    file: "personas/john.md"
    name: "John"
    summary: "Mid-level marketing specialist, reliable and measured"

  - id: "alice"
    file: "personas/alice.md"
    name: "Alice"
    summary: "Head of Marketing & Sales, senior executive, firm but fair"

  # ... 8 more personas

scripts:
  - id: "salary_negotiation"
    file: "scripts/salary_negotiation.yaml"
    title: "Salary Negotiation"
    persona_a: "john"
    persona_b: "alice"
    topic_category: "workplace"

  # ... 4-9 more scripts
```

---

## 4. ARCHITECTURE

### 4.1 High-Level Components

```
┌─────────────────────────────────────────────────────┐
│                    FastAPI Server                     │
│                    (main.py)                          │
│                                                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐ │
│  │ REST API │   │WebSocket │   │ Content Loader   │ │
│  │/scripts  │   │/ws/{sid} │   │ (reads YAML/MD)  │ │
│  │/personas │   │          │   │                  │ │
│  └──────────┘   └────┬─────┘   └──────────────────┘ │
│                      │                                │
│               ┌──────▼──────┐                        │
│               │  Session    │   One per WebSocket     │
│               │  Manager    │   connection             │
│               └──────┬──────┘                        │
│                      │                                │
│        ┌─────────────▼─────────────┐                 │
│        │       Director            │                 │
│        │  (state machine per       │                 │
│        │   session)                │                 │
│        └─────┬──────────┬──────────┘                 │
│              │          │                            │
│     ┌────────▼───┐  ┌──▼─────────┐                  │
│     │  Context   │  │ Engagement │                   │
│     │  Manager   │  │ Engine     │                   │
│     └────────┬───┘  └────────────┘                   │
│              │                                        │
│     ┌────────▼────────┐                              │
│     │  LLM Client     │                              │
│     │  (Anthropic SDK) │                              │
│     └─────────────────┘                              │
└─────────────────────────────────────────────────────┘
```

### 4.2 Session Lifecycle

```
1. Client connects to WebSocket /ws/session
2. Client sends: { "action": "start", "script_id": "salary_negotiation" }
3. Server loads script YAML + both persona soul documents
4. Server creates Director + ContextManager + EngagementEngine
5. Director starts the conversation loop:
   a. Build prompt for current speaker
   b. Call LLM API
   c. Send response to client: { "speaker": "john", "text": "..." }
   d. Check for phase transition
   e. Check for engagement trigger
   f. Alternate speaker
   g. After sending each message, wait briefly for user input
6. If client sends: { "action": "speak", "text": "I think..." }
   → Director handles user interruption
7. If Director triggers engagement:
   → Agent asks learner a question
   → Director waits for client response
8. Client sends: { "action": "end" } or conversation reaches final phase
   → Session cleanup
```

### 4.3 WebSocket Message Protocol

**Client → Server:**

```json
{ "action": "start", "script_id": "salary_negotiation" }
{ "action": "speak", "text": "I think John deserves the raise" }
{ "action": "end" }
{ "action": "ping" }
```

**Server → Client:**

```json
{ "type": "agent_turn", "speaker": "john", "speaker_name": "John", "text": "..." }
{ "type": "agent_turn", "speaker": "alice", "speaker_name": "Alice", "text": "..." }
{ "type": "engagement", "speaker": "alice", "speaker_name": "Alice", "text": "What do you think — am I being unreasonable?", "awaiting_response": true }
{ "type": "phase_change", "phase": 2, "phase_name": "the_pushback" }
{ "type": "session_started", "script_id": "salary_negotiation", "title": "Salary Negotiation", "personas": ["John", "Alice"] }
{ "type": "session_ended", "reason": "completed" }
{ "type": "error", "message": "..." }
{ "type": "pong" }
```

---

## 5. MODULE SPECIFICATIONS

### 5.1 `content_loader.py` — Content Loading & Validation

**Purpose**: Load and validate all content files at startup and on-demand.

**Implementation details**:

- Load `content/registry.yaml` on startup.
- Provide `load_persona(persona_id) -> PersonaData` that reads the markdown file, extracts sections using regex on `## ` headers.
- Provide `load_script(script_id) -> ScriptData` that reads the YAML file and parses it into Pydantic models.
- **Validate on load**: Check that every script's `persona_a.id` and `persona_b.id` exist in the persona registry. Check that soul documents have all required sections. Raise clear errors on missing content.
- Cache loaded content in memory (it's small — a few hundred KB total).

**Persona parsing rules**:
- Split the markdown on `## ` headings.
- Store each section as a dict: `{"Identity": "...", "Core Beliefs": "...", ...}`
- The `Emotional Arc` section must be parsed into a list of numbered phases.
- The `Counterpart Briefing Template` must be extracted separately — it's used in the OTHER persona's prompt.
- The FULL soul document text (minus the Counterpart Briefing section) is what gets injected as the system prompt. Keep it as raw markdown.

### 5.2 `models.py` — Pydantic Data Models

**Purpose**: Type-safe data structures used across the system.

```python
# Key models to define:

class PersonaData:
    id: str
    name: str
    soul_document: str           # full markdown text for system prompt
    counterpart_briefing: str    # compact summary for the other agent
    emotional_arc: list[str]     # parsed from ## Emotional Arc section

class PhaseConfig:
    id: int
    name: str
    description: str
    persona_a_arc: str
    persona_a_territory: list[str]
    persona_a_instruction: str
    persona_a_tone_example: str
    persona_b_arc: str
    persona_b_territory: list[str]
    persona_b_instruction: str
    persona_b_tone_example: str
    min_turns: int
    max_turns: int
    engagement_eligible: bool

class ScriptData:
    id: str
    title: str
    description: str
    persona_a: PersonaData
    persona_b: PersonaData
    opening_speaker: str          # "persona_a" or "persona_b"
    learner_context: str
    phases: list[PhaseConfig]
    engagement_templates_a: list[str]
    engagement_templates_b: list[str]

class Turn:
    speaker: str                  # "persona_a", "persona_b", or "learner"
    speaker_name: str             # "John", "Alice", "Learner"
    text: str
    phase: int
    turn_number: int
    is_engagement: bool

class SessionState:
    session_id: str
    script: ScriptData
    current_phase: int
    turn_number: int
    current_speaker: str          # "persona_a" or "persona_b"
    conversation_log: list[Turn]
    running_summary: str
    engagement_schedule: list[tuple[int, str]]  # (turn_number, speaker)
    engagement_cooldown: int      # turns remaining before next eligible
    awaiting_learner: bool        # waiting for learner response
    phase_turn_count: int         # turns within current phase
```

### 5.3 `context_manager.py` — Prompt Assembly & Context Window

**Purpose**: Assemble the three-layer prompt for each LLM call. Manage the sliding window. Handle summarization.

**Three layers**:

1. **System prompt** (Layer 1 — Cached): The speaking persona's soul document. This is set as the `system` parameter in the API call with `cache_control: {"type": "ephemeral"}`.

2. **Scene directive** (Layer 2 — Changes per phase): Built from the script's phase config for the current speaker. Includes:
   - Current phase info and emotional arc position
   - Territory to explore (from YAML)
   - Instruction and tone example
   - Counterpart briefing (who the other person is)
   - Learner context (from YAML)
   - Optional engagement instruction (if triggered)

3. **Conversation history** (Layer 3 — Changes every turn): Sliding window of recent turns, plus an optional running summary of older turns.

**Sliding window rules**:
- Always include the last 8 turns in full.
- If conversation_log has more than 8 turns, prepend a running summary of turns 0...(N-8).
- Update the running summary every 10 turns using a Haiku call.

**Prompt structure for each API call**:
```python
{
    "model": "claude-sonnet-4-5-20250514",
    "max_tokens": 250,          # keep responses short for conversational feel
    "system": [{
        "type": "text",
        "text": persona.soul_document,
        "cache_control": {"type": "ephemeral"}
    }],
    "cache_control": {"type": "ephemeral"},  # auto-cache growing messages
    "messages": [{
        "role": "user",
        "content": scene_directive + "\n\n" + conversation_history + "\n\n" + turn_instruction
    }]
}
```

**The turn_instruction** at the end is always:
```
It is your turn, {Name}. Stay in character. Respond with 2-4 sentences maximum. Do not narrate actions — speak only dialogue.
```

If there's a learner interruption, prepend:
```
The Learner just said: "{learner_text}"
Respond to the Learner briefly (1-2 sentences) in character, then continue the conversation with {other_persona_name}.
```

If engagement is triggered, replace the turn instruction with:
```
Instead of continuing the conversation, turn to the Learner and ask them a question.
Use this as inspiration (rephrase naturally): "{selected_engagement_template}"
Ask one question only, then wait for their response.
```

### 5.4 `director.py` — Orchestration State Machine

**Purpose**: The central loop that drives the conversation forward.

**State machine states**:
```
IDLE → STARTING → AGENT_TURN → WAITING_FOR_AGENT_RESPONSE →
  → DELIVERING_TURN → CHECK_PHASE → (loop back to AGENT_TURN)
  → ENGAGEMENT_ASKED → WAITING_FOR_LEARNER → LEARNER_RESPONDED → AGENT_TURN
  → LEARNER_INTERRUPTED → AGENT_RESPONDING_TO_LEARNER → AGENT_TURN
  → CONVERSATION_ENDED
```

**Director loop pseudocode** (implement as async):

```
async def run_conversation(session: SessionState, ws: WebSocket):
    send session_started message

    while session.current_phase < len(session.script.phases):
        phase = session.script.phases[session.current_phase]

        # Check for user input with short timeout
        user_input = await receive_with_timeout(ws, timeout=0.5)

        if user_input and user_input["action"] == "speak":
            handle_learner_interruption(session, user_input["text"])
            continue

        if user_input and user_input["action"] == "end":
            break

        # Check engagement trigger
        engagement_active = should_trigger_engagement(session)

        # Build and execute agent turn
        response = await execute_agent_turn(
            session, engagement_active
        )

        # Send to client
        send turn message via ws

        # Add to conversation log
        session.conversation_log.append(turn)
        session.turn_number += 1
        session.phase_turn_count += 1

        # Phase transition check
        if should_advance_phase(session):
            session.current_phase += 1
            session.phase_turn_count = 0
            send phase_change message via ws

        # Alternate speakers (unless engagement is waiting)
        if not session.awaiting_learner:
            alternate_speaker(session)

        # Pacing delay — simulate natural conversation rhythm
        await asyncio.sleep(2.0)

    send session_ended message
```

**Phase transition logic**:

```python
def should_advance_phase(session: SessionState) -> bool:
    phase = session.script.phases[session.current_phase]

    # Hard minimum: don't advance until min_turns
    if session.phase_turn_count < phase.min_turns:
        return False

    # Hard maximum: force advance at max_turns
    if session.phase_turn_count >= phase.max_turns:
        return True

    # Soft check: every 3 turns after min, ask Haiku if phase territory is covered
    if session.phase_turn_count >= phase.min_turns and session.phase_turn_count % 3 == 0:
        return await check_phase_coverage_with_llm(session)

    return False
```

**The Haiku phase-check call** (cheap, fast):

```
System: You are evaluating whether a conversation phase is complete.
User: 
Phase: "{phase.description}"
Territory to cover: {phase.persona_a_territory + phase.persona_b_territory}
Last 4 turns: {last_4_turns}

Has the core territory of this phase been sufficiently explored?
Respond with exactly YES or NO.
```

**Who responds to learner interruptions**:

```python
def decide_responder(session: SessionState, learner_text: str) -> str:
    text_lower = learner_text.lower()
    persona_a_name = session.script.persona_a.name.lower()
    persona_b_name = session.script.persona_b.name.lower()

    # Rule 1: If learner addresses someone by name
    if persona_a_name in text_lower:
        return "persona_a"
    if persona_b_name in text_lower:
        return "persona_b"

    # Rule 2: Default to whichever agent's turn it would have been next
    return session.current_speaker
```

### 5.5 `engagement.py` — Random Engagement Engine

**Purpose**: Determine when and how agents ask the learner for input.

**Schedule generation** (called once at session start):

```python
def generate_engagement_schedule(
    script: ScriptData,
    seed: int | None = None
) -> list[tuple[int, str]]:
    """
    Returns list of (estimated_turn_number, "persona_a"|"persona_b")
    indicating when engagement should trigger.
    """
    rng = random.Random(seed)  # new seed per session for variety
    schedule = []
    estimated_turn = 0

    for phase in script.phases:
        if not phase.engagement_eligible:
            estimated_turn += (phase.min_turns + phase.max_turns) // 2
            continue

        # 60% chance of engagement per eligible phase
        if rng.random() < 0.6:
            # Pick a turn roughly in the middle of the phase
            mid = estimated_turn + (phase.min_turns + phase.max_turns) // 4
            turn = rng.randint(mid - 1, mid + 2)
            speaker = rng.choice(["persona_a", "persona_b"])
            schedule.append((turn, speaker))

        estimated_turn += (phase.min_turns + phase.max_turns) // 2

    return schedule
```

**Trigger check** (called before each agent turn):

```python
def should_trigger_engagement(session: SessionState) -> bool:
    if session.engagement_cooldown > 0:
        session.engagement_cooldown -= 1
        return False

    for sched_turn, sched_speaker in session.engagement_schedule:
        if (abs(session.turn_number - sched_turn) <= 1
            and session.current_speaker == sched_speaker):
            session.engagement_cooldown = 4  # 4-turn cooldown after engagement
            return True

    return False
```

**Template selection**:

```python
def select_engagement_question(session: SessionState) -> str:
    if session.current_speaker == "persona_a":
        templates = session.script.engagement_templates_a
    else:
        templates = session.script.engagement_templates_b

    rng = random.Random(session.turn_number)  # deterministic per turn
    return rng.choice(templates)
```

### 5.6 `llm_client.py` — Anthropic API Wrapper

**Purpose**: Thin wrapper around the Anthropic Python SDK. Handles API calls, error handling, retries, and token tracking.

**Implementation details**:

- Use the official `anthropic` Python SDK (pip install anthropic).
- Implement async calls using `client.messages.create()`.
- Add exponential backoff retry on 429 (rate limit) and 529 (overload) errors.
- Track token usage per session for cost monitoring: input_tokens, cache_read_tokens, cache_creation_tokens, output_tokens.
- Log every API call's token usage for debugging.
- **Do NOT use LangChain, LlamaIndex, or any orchestration framework.** Direct SDK calls only.

```python
# Key function signature:
async def generate_response(
    system_prompt: str,
    user_message: str,
    model: str = "claude-sonnet-4-5-20250514",
    max_tokens: int = 250,
    use_cache: bool = True
) -> tuple[str, dict]:
    """
    Returns (response_text, usage_dict).
    usage_dict has: input_tokens, output_tokens, cache_read_input_tokens,
                    cache_creation_input_tokens
    """
```

**Retry strategy**:
- Max 3 retries
- Exponential backoff: 1s, 2s, 4s
- On 429: respect `retry-after` header if present
- On 529: backoff without counting against retry limit

### 5.7 `main.py` — FastAPI Application

**Purpose**: HTTP and WebSocket entry point.

**REST endpoints** (for frontend to discover available content):

```
GET /api/scripts          → list of available scripts with metadata
GET /api/scripts/{id}     → single script details (title, personas, description)
GET /api/personas         → list of available personas with summaries
GET /api/health           → health check
```

**WebSocket endpoint**:

```
WS /ws/session            → main conversation channel
```

**Implementation details**:

- Use `uvicorn` as the ASGI server.
- On startup, load the content registry and validate all content files.
- Each WebSocket connection creates one Director instance (one session).
- Use `asyncio.create_task` for the Director's conversation loop so it runs concurrently with receiving client messages.
- Implement heartbeat ping/pong every 30 seconds.
- Graceful shutdown: on disconnect, cancel the Director task and clean up.

---

## 6. IMPLEMENTATION ORDER

**Claude Code should implement in this exact order.** Each step must be testable before moving to the next.

### Step 1: Data Models & Content Loader
**Files**: `models.py`, `content_loader.py`
**Test**: Write a test that loads the example persona files and script YAML, validates them, and prints the parsed structures. Verify soul document sections are correctly extracted. Verify phase configs parse from YAML.

### Step 2: LLM Client
**Files**: `llm_client.py`
**Test**: Write a standalone test that sends a simple message to Claude Sonnet with a cached system prompt and gets a response. Verify cache headers are returned. Print token usage.

### Step 3: Context Manager
**Files**: `context_manager.py`
**Test**: Write a test that builds a full prompt for a persona turn with a fake conversation history. Print the assembled prompt. Verify token count is reasonable (<5,000 tokens). Test the sliding window: create 20 fake turns, verify only last 8 appear in the prompt. Test summary generation with a real Haiku call.

### Step 4: Two-Agent Conversation (No User Input)
**Files**: `director.py` (basic version), `engagement.py` (stub)
**Test**: Run a complete two-agent conversation from a terminal script (no WebSocket). The Director alternates between John and Alice, advancing through all 5 phases. Print each turn with speaker labels. This is the **critical proof-of-concept gate**. If the conversation sounds natural, covers the right territory, and follows the emotional arc, the core concept works.

**CRITICAL**: Spend time here iterating on the system prompt + scene directive format. The quality of the output depends almost entirely on how well the prompts are structured. Do not rush past this step.

### Step 5: Engagement Engine
**Files**: `engagement.py` (full version), update `director.py`
**Test**: Run the same two-agent conversation but with engagement triggers active. Verify that 2-4 times during the conversation, an agent stops to ask the learner a question. For testing, auto-respond with a canned learner answer. Verify the conversation resumes naturally after the engagement.

### Step 6: User Interruption Handling
**Files**: Update `director.py`
**Test**: Run the conversation with a simulated user who interjects at turn 8 and turn 15 with specific text. Verify the responding agent acknowledges the learner's input and steers back to the script territory.

### Step 7: WebSocket Server
**Files**: `main.py`
**Test**: Start the server. Connect with a WebSocket client (can use `websocat` CLI tool or a simple Python script). Start a session, watch the conversation stream, send a learner message mid-conversation, verify it works end-to-end.

### Step 8: REST API
**Files**: Update `main.py`
**Test**: Hit /api/scripts and /api/personas, verify they return correct content from the registry.

---

## 7. PROMPT ENGINEERING SPECIFICATIONS

This section defines the exact prompt structures. Claude Code must implement these precisely — the quality of the entire product depends on getting these right.

### 7.1 System Prompt (Per Persona)

The system prompt IS the soul document, verbatim, with one addition at the top:

```
You are {Name}, {Role}. You are in a live conversation. Everything below
defines who you are — your personality, beliefs, speech patterns, and
emotional range. Stay in character at all times. Never break character.
Never narrate actions. Speak only dialogue — as if you are actually
talking in a room.

{FULL SOUL DOCUMENT MARKDOWN}
```

### 7.2 Scene Directive Template

```
SCENE DIRECTIVE
═══════════════
Topic: {script.title}
Scene: {script.description}
Phase {current_phase} of {total_phases}: "{phase.name}"

YOUR EMOTIONAL ARC FOR THIS PHASE:
{phase.persona_X_arc}

TERRITORY TO EXPLORE:
{bullet list of phase.persona_X_territory items}

DIRECTION:
{phase.persona_X_instruction}

TONE/STYLE REFERENCE (use as inspiration, do NOT recite):
"{phase.persona_X_tone_example}"

YOUR COUNTERPART:
{other_persona.counterpart_briefing}

{script.learner_context}

{OPTIONAL: engagement instruction if triggered}
{OPTIONAL: learner interruption handling if user spoke}
```

### 7.3 Conversation History Format

```
CONVERSATION SO FAR:
════════════════════
{IF running_summary exists:}
[Earlier: {running_summary}]
---
{END IF}
{FOR each turn in sliding_window:}
{SPEAKER_NAME}: {text}
{END FOR}
---
It is your turn, {Name}. Stay in character.
Respond with 2-4 sentences maximum. Do not narrate actions.
Speak only dialogue.
```

### 7.4 Summary Generation Prompt (Haiku)

```
System: You are a conversation summarizer. Be extremely concise.

User:
Summarize the key points of this conversation in 2-3 sentences.
Focus on: what arguments were made, what positions were taken,
and where the emotional tone shifted.

{turns_to_summarize}
```

---

## 8. API & COST STRATEGY

### 8.1 Caching Architecture

```
API Call Structure (in Anthropic processing order):
1. System prompt: [Soul document ~2,500 tokens] → CACHED
2. Messages: [Scene directive ~300 tokens + History ~1,500 tokens] → auto-cached growing prefix

Cache hit pattern per session:
- Turn 1: Cache WRITE for soul doc (1.25x base cost)
- Turn 2+: Cache READ for soul doc (0.10x base cost) ← 90% savings
- Message history: auto-cached, growing prefix cached automatically
```

### 8.2 Token Budget Per Call

| Component | Tokens | Changes? |
|-----------|--------|----------|
| System prompt (soul doc) | 2,000-3,500 | Never (cached) |
| Scene directive | 200-400 | Per phase |
| Conversation history (8 turns) | 800-1,600 | Per turn |
| Turn instruction | 50-80 | Per turn |
| **Total input** | **3,050-5,580** | |
| Output (2-4 sentences) | 60-150 | Per turn |

### 8.3 Projected Cost Table

| Sessions/day | Cost/session | Daily cost | Monthly cost |
|-------------|-------------|------------|-------------|
| 10 | $0.25 | $2.50 | $75 |
| 100 | $0.25 | $25 | $750 |
| 1,000 | $0.25 | $250 | $7,500 |

### 8.4 Rate Limit Planning

At Tier 2 ($40 deposit): 1,000 RPM, 400,000 ITPM

- Each session: ~12-20 RPM, ~50,000 ITPM (with caching, effective ITPM much lower)
- Safe concurrent sessions at Tier 2: **20-30**
- At Tier 3: **100+** concurrent sessions

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests

**Test files follow the module they test**: `tests/test_content_loader.py`, `tests/test_context_manager.py`, etc.

| Test | What it validates |
|------|------------------|
| `test_load_persona` | Soul document parses, all required sections present |
| `test_load_script` | YAML parses, phase configs valid, persona IDs resolve |
| `test_missing_persona` | Error raised when script references nonexistent persona |
| `test_build_prompt` | Assembled prompt has correct structure and token count <6,000 |
| `test_sliding_window` | With 20 turns, only last 8 in prompt |
| `test_engagement_schedule` | Schedule generates 2-5 triggers, different with different seeds |
| `test_engagement_cooldown` | No triggers within cooldown period |
| `test_phase_transition_min` | Phase doesn't advance before min_turns |
| `test_phase_transition_max` | Phase forces advance at max_turns |
| `test_responder_selection` | Correct agent responds when learner addresses by name |

### 9.2 Integration Tests (Require API Key)

| Test | What it validates |
|------|------------------|
| `test_single_agent_turn` | One persona generates an in-character response |
| `test_two_agent_exchange` | 4 turns of alternating dialogue, coherent conversation |
| `test_full_conversation` | Complete 5-phase conversation, all phases reached |
| `test_learner_interruption` | Agent responds to learner input and resumes script |
| `test_engagement_and_response` | Agent asks learner, learner responds, conversation resumes |
| `test_prompt_caching` | Second API call shows cache_read_input_tokens > 0 |
| `test_session_cost` | Full session stays under $0.50 |

### 9.3 The "Vibe Test" (Manual QA)

After Step 4 (two-agent conversation), manually read through 3 full conversations and evaluate:

- [ ] Do the characters sound distinct? (John should feel different from Alice)
- [ ] Does the conversation follow the emotional arc? (warm → strategic → frustrated → vulnerable → resolved)
- [ ] Do arguments make sense and draw from the soul document's core beliefs?
- [ ] Are responses the right length? (2-4 sentences, conversational)
- [ ] Does the conversation feel like two people talking, not two AI reciting scripts?
- [ ] Does it progress through all 5 phases without getting stuck or rushing?

If any of these fail, **stop and fix the prompts** before proceeding to Step 5.

---

## 10. FILE STRUCTURE

```
project/
├── CLAUDE.md                          # Claude Code project instructions
├── requirements.txt                   # Python dependencies
├── .env.example                       # Environment variable template
│
├── content/
│   ├── registry.yaml                  # Index of all personas and scripts
│   ├── personas/
│   │   ├── john.md                    # Soul document
│   │   ├── alice.md
│   │   └── ... (8 more)
│   └── scripts/
│       ├── salary_negotiation.yaml    # Conversation script
│       └── ... (4-9 more)
│
├── src/
│   ├── __init__.py
│   ├── main.py                        # FastAPI app + WebSocket + REST
│   ├── models.py                      # Pydantic data models
│   ├── content_loader.py              # Parse MD + YAML content
│   ├── context_manager.py             # 3-layer prompt assembly
│   ├── director.py                    # Orchestration state machine
│   ├── engagement.py                  # Random engagement engine
│   └── llm_client.py                  # Anthropic SDK wrapper
│
└── tests/
    ├── __init__.py
    ├── test_content_loader.py
    ├── test_context_manager.py
    ├── test_director.py
    ├── test_engagement.py
    ├── test_llm_client.py
    └── test_integration.py            # Full conversation tests (needs API key)
```

### CLAUDE.md (for Claude Code to read)

```markdown
# Project: Multi-Persona Conversational Learning Platform

## Tech Stack
- Python 3.12+
- FastAPI + uvicorn (ASGI server)
- anthropic Python SDK (direct API calls, NO LangChain)
- pydantic for data models
- pyyaml for script parsing
- pytest for testing

## Key Architecture Decisions
- NO multi-agent frameworks (LangChain, LangGraph, CrewAI, etc.)
- Direct Anthropic SDK calls only
- Each persona gets its own system prompt (soul document) — never put two personas in one prompt
- Scripts are YAML, personas are Markdown
- WebSocket for real-time communication, REST for content discovery
- Prompt caching is mandatory — soul documents go in system prompt with cache_control

## Implementation Plan
Read IMPLEMENTATION_PLAN.md for the full specification.
Follow the implementation order in Section 6 exactly.
Do not skip the "Vibe Test" after Step 4.

## Content Format
- Persona files: content/personas/{id}.md — see Section 3.1 for required format
- Script files: content/scripts/{id}.yaml — see Section 3.2 for schema
- Registry: content/registry.yaml — see Section 3.3

## Testing
- Unit tests: pytest tests/ -k "not integration"
- Integration tests (need ANTHROPIC_API_KEY): pytest tests/test_integration.py
- Always run unit tests before committing

## Environment Variables
- ANTHROPIC_API_KEY: Required
- LLM_MODEL: Default "claude-sonnet-4-5-20250514"
- LLM_MODEL_CHEAP: Default "claude-haiku-4-5-20251001"  
- HOST: Default "0.0.0.0"
- PORT: Default 8000
```

### requirements.txt

```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
anthropic>=0.42.0
pydantic>=2.10.0
pyyaml>=6.0.2
python-dotenv>=1.0.1
pytest>=8.0.0
pytest-asyncio>=0.24.0
websockets>=13.0
```

---

## 11. KEY RISKS & MITIGATIONS

### Risk 1: Persona Bleed
**What**: The LLM starts mixing up character voices — John sounds like Alice, or both sound generic.
**Likelihood**: Medium
**Mitigation**: Each agent has its own system prompt with ONLY its soul document. Never put both soul documents in one prompt. The counterpart briefing is deliberately brief (~80 tokens) to prevent the LLM from "absorbing" the other character. If bleed persists, reduce the counterpart briefing further.

### Risk 2: Script Drift
**What**: The conversation wanders away from the scripted territory and never covers key points.
**Likelihood**: Medium-High without good prompt engineering
**Mitigation**: The scene directive's "territory" list explicitly tells the agent what to cover. The tone_example grounds the expected style. The phase transition check (via Haiku) ensures the conversation doesn't advance until territory is covered. The max_turns hard cap prevents infinite loops.

### Risk 3: Robotic Responses
**What**: Agents recite script lines instead of paraphrasing naturally.
**Mitigation**: The prompt explicitly says "use as inspiration, do NOT recite." The soul document's speech patterns section gives the LLM enough character detail to generate original dialogue. If responses are too close to examples, reduce the tone_example to just one sentence.

### Risk 4: User Input Derails Conversation
**What**: A learner says something completely off-topic and the agents can't recover.
**Likelihood**: Medium
**Mitigation**: The response-to-learner instruction explicitly says "respond briefly (1-2 sentences), then continue the conversation." The `max_tokens: 250` cap prevents rambling. The soul document's character consistency helps the agent stay on track. If severe derailment happens, the Director can inject a redirect: "Continue the negotiation where you left off."

### Risk 5: Rate Limits Under Load
**What**: Multiple concurrent sessions hit API rate limits.
**Mitigation**: Start at Tier 2 minimum ($40 deposit). Prompt caching dramatically reduces effective ITPM (cached tokens don't count toward limits). Add exponential backoff in llm_client.py. For MVP, limit concurrent sessions to 5 and queue additional requests.

### Risk 6: Context Window Growth
**What**: Long sessions with many learner interruptions bloat the conversation history beyond efficient context sizes.
**Mitigation**: Hard sliding window of 8 turns. Summarization every 10 turns. max_tokens of 250 per response keeps individual turns short. Total context stays under 6,000 tokens per call even in worst case.

---

## APPENDIX: Converting the Example Script to YAML

The existing `salary_negotiation_script_5min.md` file is a reference document for content creation. To create a new script from a markdown screenplay:

1. Read the markdown and identify the natural emotional phases (usually 4-6).
2. For each phase, extract:
   - The territory (what arguments/topics are covered)
   - The emotional arc for each character
   - A representative line as a tone example
3. Write the YAML following the schema in Section 3.2.
4. Add engagement templates — questions each character might ask the learner.
5. Add the corresponding soul documents for each persona.
6. Register everything in `content/registry.yaml`.

The script markdown can be kept as a reference file in `content/scripts/references/` but the system only reads the YAML files.
