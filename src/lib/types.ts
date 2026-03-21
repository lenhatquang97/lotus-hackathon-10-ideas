export type CefrLevel = 'A2' | 'B1' | 'B2' | 'C1';
export type Domain = 'professional' | 'social' | 'travel' | 'academic' | 'daily-life';
export type Environment = 'office' | 'cafe' | 'interview' | 'apartment';
export type AgentRole = 'anchor' | 'challenger' | 'observer';
export type CommunicationStyle = 'formal' | 'casual' | 'technical' | 'empathetic' | 'aggressive';
export type RelationshipType = 'stranger' | 'authority' | 'peer' | 'subordinate';

export interface AgentPersona {
  id: string;
  name: string;
  role: AgentRole;
  age: number;
  nationality: string;
  profession: string;
  communicationStyle: CommunicationStyle;
  accent: string;
  personality: string;
  opinionAnchors: string[];
  relationshipToLearner: RelationshipType;
}

export interface World {
  id: string;
  title: string;
  description: string;
  cefrLevel: CefrLevel;
  domain: Domain;
  duration: number;
  agents: AgentPersona[];
  scenarioContext: string;
  conversationBeats: string[];
  environment: Environment;
  createdAt: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'agent';
  agentId?: string;
  agentName?: string;
  text: string;
  timestamp: number;
}

export interface DimensionScore {
  score: number;
  subMetrics: Record<string, number>;
  narrative: string;
}

export interface Highlight {
  timestamp: number;
  type: 'positive' | 'developmental';
  text: string;
  explanation: string;
}

export interface Evaluation {
  overall: number;
  tone: DimensionScore;
  content: DimensionScore;
  firstVoice: DimensionScore;
  highlights: Highlight[];
  vocabularyUsed: string[];
  vocabularyAvailable: string[];
  coachNarrative: string;
}

export interface SessionResult {
  id: string;
  worldId: string;
  worldTitle: string;
  transcript: TranscriptEntry[];
  duration: number;
  evaluation: Evaluation;
  completedAt: string;
}

// ── Composing Studio types ──

export type KnowledgeItemType = 'file' | 'url' | 'text';

export interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  name: string;
  content: string;
  status: 'ready' | 'processing';
  meta?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    url?: string;
  };
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface BriefPreview {
  status: 'empty' | 'reading' | 'partial' | 'ready';
  suggestedTitle: string;
  setting: string;
  scenario: string;
  detectedTopics: string[];
  suggestedCharacterCount: number;
  suggestedDifficulty: string;
  vocabularyHints: string[];
  scenarioSummary: string;
  suggestedAgentNames: string[];
  estimatedDurationMin: number;
  confidence: number;
}

export interface GenerateWorldRequest {
  brief: string;
  knowledgeItems: KnowledgeItem[];
  difficulty: Difficulty;
}
