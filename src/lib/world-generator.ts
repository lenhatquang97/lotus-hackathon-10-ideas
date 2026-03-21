import type { World } from './types';

export const WORLD_GENERATION_PROMPT = `You are a world-building AI for an English language learning platform. Given a user's prompt describing a scenario, generate a complete world configuration for immersive English conversation practice.

Output ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "title": "string - compelling, descriptive title (5-8 words)",
  "description": "string - 2-3 sentence description of the scenario and what the learner will practice",
  "cefrLevel": "B1" | "B2" | "A2" | "C1",
  "domain": "professional" | "social" | "travel" | "academic" | "daily-life",
  "duration": number (minutes, 5-15),
  "environment": "office" | "cafe" | "interview" | "apartment",
  "scenarioContext": "string - 2-3 sentences setting the scene for the learner, written in second person",
  "conversationBeats": ["string array of 4-5 narrative beats that guide the conversation arc"],
  "agents": [
    {
      "name": "string - full name",
      "role": "anchor" | "challenger" | "observer",
      "age": number,
      "nationality": "string",
      "profession": "string",
      "communicationStyle": "formal" | "casual" | "technical" | "empathetic" | "aggressive",
      "accent": "string - specific English accent (e.g., 'British RP', 'American English', 'Indian English')",
      "personality": "string - 2-3 sentences describing personality traits and communication tendencies",
      "opinionAnchors": ["3-5 string opinions this person holds relevant to the scenario"],
      "relationshipToLearner": "stranger" | "authority" | "peer" | "subordinate"
    }
  ]
}

Rules:
- Generate 2-3 agents with distinct personalities and roles
- Exactly ONE agent must have role "anchor" (drives the main conversation)
- At least one should have a different accent from the others
- Agents should have natural disagreements or different perspectives
- The scenario must create opportunities for the learner to practice initiative, not just respond
- Match the CEFR level to the vocabulary complexity implied by the prompt
- The scenario context should make the learner feel like they have a clear role and purpose`;

export function buildWorldFromResponse(json: Record<string, unknown>, id: string): World {
  const agents = (json.agents as Array<Record<string, unknown>>).map((a, i) => ({
    id: `gen-agent-${id}-${i}`,
    name: a.name as string,
    role: a.role as World['agents'][0]['role'],
    age: a.age as number,
    nationality: a.nationality as string,
    profession: a.profession as string,
    communicationStyle: a.communicationStyle as World['agents'][0]['communicationStyle'],
    accent: a.accent as string,
    personality: a.personality as string,
    opinionAnchors: a.opinionAnchors as string[],
    relationshipToLearner: a.relationshipToLearner as World['agents'][0]['relationshipToLearner'],
  }));

  return {
    id,
    title: json.title as string,
    description: json.description as string,
    cefrLevel: json.cefrLevel as World['cefrLevel'],
    domain: json.domain as World['domain'],
    duration: json.duration as number,
    environment: json.environment as World['environment'],
    scenarioContext: json.scenarioContext as string,
    conversationBeats: json.conversationBeats as string[],
    agents,
    createdAt: new Date().toISOString(),
  };
}
