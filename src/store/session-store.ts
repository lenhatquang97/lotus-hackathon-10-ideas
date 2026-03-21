'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TranscriptEntry, SessionResult } from '@/lib/types';

interface SessionStore {
  // Active session
  activeWorldId: string | null;
  activeAgentId: string | null;
  transcript: TranscriptEntry[];
  sessionStartTime: number | null;
  isConnected: boolean;
  isSpeaking: boolean;

  // History
  sessions: SessionResult[];

  // Actions
  startSession: (worldId: string, agentId: string) => void;
  endSession: () => void;
  setActiveAgent: (agentId: string) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  setConnected: (connected: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  saveSession: (result: SessionResult) => void;
  getSession: (id: string) => SessionResult | undefined;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      activeWorldId: null,
      activeAgentId: null,
      transcript: [],
      sessionStartTime: null,
      isConnected: false,
      isSpeaking: false,
      sessions: [],

      startSession: (worldId, agentId) => set({
        activeWorldId: worldId,
        activeAgentId: agentId,
        transcript: [],
        sessionStartTime: Date.now(),
        isConnected: false,
        isSpeaking: false,
      }),

      endSession: () => set({
        activeWorldId: null,
        activeAgentId: null,
        sessionStartTime: null,
        isConnected: false,
        isSpeaking: false,
      }),

      setActiveAgent: (agentId) => set({ activeAgentId: agentId }),

      addTranscriptEntry: (entry) => set((state) => ({
        transcript: [...state.transcript, entry],
      })),

      setConnected: (connected) => set({ isConnected: connected }),
      setSpeaking: (speaking) => set({ isSpeaking: speaking }),

      saveSession: (result) => set((state) => ({
        sessions: [result, ...state.sessions],
      })),

      getSession: (id) => get().sessions.find(s => s.id === id),
    }),
    {
      name: 'session-store',
      partialize: (state) => ({ sessions: state.sessions }),
    }
  )
);
