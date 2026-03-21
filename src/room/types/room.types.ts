export type RoomMode = 'solo' | 'social';

export type RoomStateEnum =
  | 'CONNECTING'
  | 'AMBIENT'
  | 'AGENT_SPEAKING'
  | 'LEARNER_SPEAKING'
  | 'PROCESSING'
  | 'SILENCE'
  | 'ENDING';

export type AgentRole = 'ANCHOR' | 'CHALLENGER' | 'OBSERVER';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  avatarColor: string;
}

export interface Peer {
  id: string;
  displayName: string;
  isSpeaking: boolean;
  isConnected: boolean;
}

export interface TranscriptLine {
  id: string;
  speakerId: string;
  speakerName: string;
  isUser: boolean;
  text: string;
  isStreaming: boolean;
  timestamp: number;
}

export interface EvalScore {
  tone: number;
  content: number;
  firstVoice: number;
}

export interface RoomStore {
  roomMode: RoomMode;
  worldName: string;
  sessionElapsed: number;

  roomState: RoomStateEnum;
  activeAgentId: string | null;
  floorOwnerId: string | null;
  silenceSeconds: number;

  agents: Agent[];
  peers: Peer[];

  transcript: TranscriptLine[];
  evalScore: EvalScore;

  transcriptPanelOpen: boolean;
  micMuted: boolean;
  isMicActive: boolean;
}
