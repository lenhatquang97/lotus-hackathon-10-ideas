'use client';

import { create } from 'zustand';
import type { RoomStore, RoomStateEnum, TranscriptLine, EvalScore } from './types/room.types';

interface RoomActions {
  setRoomState: (state: RoomStateEnum) => void;
  setActiveAgent: (agentId: string | null) => void;
  setFloorOwner: (id: string | null) => void;
  appendTranscriptChunk: (lineId: string, chunk: string) => void;
  addTranscriptLine: (line: TranscriptLine) => void;
  finalizeTranscriptLine: (lineId: string) => void;
  updateEvalScore: (delta: Partial<EvalScore>) => void;
  toggleTranscriptPanel: () => void;
  setMicMuted: (muted: boolean) => void;
  setMicActive: (active: boolean) => void;
  tickSilence: () => void;
  resetSilence: () => void;
  tickSession: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore & RoomActions>((set) => ({
  // initial state
  roomMode: 'solo',
  worldName: 'Remote work discussion',
  sessionElapsed: 0,

  roomState: 'CONNECTING',
  activeAgentId: null,
  floorOwnerId: null,
  silenceSeconds: 0,

  agents: [
    { id: 'emma', name: 'Emma Caldwell', role: 'ANCHOR', avatarColor: '#4a7ab5' },
    { id: 'oliver', name: 'Oliver Park', role: 'CHALLENGER', avatarColor: '#b54a4a' },
    { id: 'priya', name: 'Priya Mehta', role: 'OBSERVER', avatarColor: '#4ab57a' },
  ],
  peers: [],

  transcript: [],
  evalScore: { tone: 0, content: 0, firstVoice: 0 },

  transcriptPanelOpen: true,
  micMuted: false,
  isMicActive: false,

  // actions
  setRoomState: (state) => set({ roomState: state }),
  setActiveAgent: (id) => set({ activeAgentId: id }),
  setFloorOwner: (id) => set({ floorOwnerId: id }),

  appendTranscriptChunk: (lineId, chunk) =>
    set((s) => ({
      transcript: s.transcript.map((l) =>
        l.id === lineId ? { ...l, text: l.text + chunk } : l
      ),
    })),

  addTranscriptLine: (line) =>
    set((s) => ({ transcript: [...s.transcript, line] })),

  finalizeTranscriptLine: (lineId) =>
    set((s) => ({
      transcript: s.transcript.map((l) =>
        l.id === lineId ? { ...l, isStreaming: false } : l
      ),
    })),

  updateEvalScore: (delta) =>
    set((s) => ({ evalScore: { ...s.evalScore, ...delta } })),

  toggleTranscriptPanel: () =>
    set((s) => ({ transcriptPanelOpen: !s.transcriptPanelOpen })),

  setMicMuted: (muted) => set({ micMuted: muted }),
  setMicActive: (active) => set({ isMicActive: active }),
  tickSilence: () => set((s) => ({ silenceSeconds: s.silenceSeconds + 1 })),
  resetSilence: () => set({ silenceSeconds: 0 }),
  tickSession: () => set((s) => ({ sessionElapsed: s.sessionElapsed + 1 })),
  reset: () => set({
    roomState: 'CONNECTING',
    sessionElapsed: 0,
    activeAgentId: null,
    floorOwnerId: null,
    silenceSeconds: 0,
    transcript: [],
    evalScore: { tone: 0, content: 0, firstVoice: 0 },
    transcriptPanelOpen: true,
    micMuted: false,
    isMicActive: false,
  }),
}));
