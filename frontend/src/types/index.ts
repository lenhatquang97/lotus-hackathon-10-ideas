export interface User {
  id: string;
  email: string;
  role: 'learner' | 'creator' | 'admin';
  profile: {
    display_name: string;
    avatar_config: { skin_tone: string; face_preset: string; clothing: string };
  };
  cefr: { self_assessed?: string; calibrated?: string };
  created_at: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  persona: string;
  bias_perception: string;
  voice_id: string;
  avatar_preset: string;
}

export interface TopicVocabItem {
  word: string;
  definition: string;
}

export interface Topic {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  domain_knowledge: string;
  status: 'draft' | 'published';
  difficulty_levels: string[];
  tags: string[];
  characters: Character[];
  vocabulary: TopicVocabItem[];
  play_count: number;
  avg_score: number;
  created_at: string;
  updated_at: string;
}

export interface TranscriptTurn {
  turn_id: string;
  speaker: 'learner' | 'character';
  character_id?: string;
  character_name?: string;
  text: string;
  timestamp: string;
  evaluation_snapshot: { tone_score: number; content_score: number; first_voice_score: number };
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface SpeakingEval {
  fluency_score: number;
  pronunciation_tips: string[];
  grammar_corrections: GrammarCorrection[];
  filler_words: string[];
  strengths: string[];
  improvements: string[];
}

export interface SessionEvaluation {
  composite_score: number;
  tone: { score: number; formality_calibration: number; assertiveness: number; emotional_congruence: number };
  content: { score: number; topical_relevance: number; logical_coherence: number; vocabulary_range: number; grammar_fluency_index: number };
  first_voice: { score: number; speaking_time_ratio: number; turn_initiation_count: number; question_quality: number; interruption_events: number };
  speaking: SpeakingEval;
  highlight_reel: Array<{ turn_id: string; label: string; coach_note: string }>;
  vocabulary_log: Array<{ word: string; used_correctly: boolean; context: string }>;
  recommended_topic_ids: string[];
  coach_narrative: string;
}

export interface Session {
  id: string;
  topic_id: string;
  learner_id: string;
  status: 'lobby' | 'active' | 'paused' | 'completed';
  started_at?: string;
  ended_at?: string;
  duration_seconds: number;
  transcript: TranscriptTurn[];
  evaluation?: SessionEvaluation;
}

// WebSocket events
export type ServerEvent =
  | { type: 'session_state'; status: string }
  | { type: 'character_speech_start'; character_id: string; character_name: string }
  | { type: 'character_speech_chunk'; audio: ArrayBuffer }
  | { type: 'character_speech_end'; text: string }
  | { type: 'transcript_update'; turn: TranscriptTurn }
  | { type: 'live_scores'; tone: number; content: number; first_voice: number }
  | { type: 'silence_warning'; seconds: number }
  | { type: 'inter_character_exchange'; from_id: string; to_id: string; text: string }
  | { type: 'error'; message: string };
