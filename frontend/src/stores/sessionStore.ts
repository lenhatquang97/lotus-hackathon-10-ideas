import { create } from 'zustand';
import { Session, TranscriptTurn } from '../types';

interface LiveScores {
  tone: number;
  content: number;
  first_voice: number;
}

interface SessionState {
  session: Session | null;
  topic: unknown | null;
  transcript: TranscriptTurn[];
  liveScores: LiveScores;
  activeSpeaker: { character_id: string; character_name: string } | null;
  isMicActive: boolean;
  isSessionActive: boolean;
  showSilenceOverlay: boolean;
  wsRef: WebSocket | null;

  setSession: (session: Session) => void;
  setTopic: (topic: unknown) => void;
  addTranscriptTurn: (turn: TranscriptTurn) => void;
  setLiveScores: (scores: Partial<LiveScores>) => void;
  setActiveSpeaker: (speaker: { character_id: string; character_name: string } | null) => void;
  setMicActive: (active: boolean) => void;
  setSessionActive: (active: boolean) => void;
  setShowSilenceOverlay: (show: boolean) => void;
  setWsRef: (ws: WebSocket | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  topic: null,
  transcript: [],
  liveScores: { tone: 0, content: 0, first_voice: 0 },
  activeSpeaker: null,
  isMicActive: false,
  isSessionActive: false,
  showSilenceOverlay: false,
  wsRef: null,

  setSession: (session) => set({ session }),
  setTopic: (topic) => set({ topic }),
  addTranscriptTurn: (turn) => set((state) => ({ transcript: [...state.transcript, turn] })),
  setLiveScores: (scores) => set((state) => ({ liveScores: { ...state.liveScores, ...scores } })),
  setActiveSpeaker: (speaker) => set({ activeSpeaker: speaker }),
  setMicActive: (active) => set({ isMicActive: active }),
  setSessionActive: (active) => set({ isSessionActive: active }),
  setShowSilenceOverlay: (show) => set({ showSilenceOverlay: show }),
  setWsRef: (ws) => set({ wsRef: ws }),
  reset: () => set({
    session: null, topic: null, transcript: [], liveScores: { tone: 0, content: 0, first_voice: 0 },
    activeSpeaker: null, isMicActive: false, isSessionActive: false, showSilenceOverlay: false, wsRef: null,
  }),
}));
