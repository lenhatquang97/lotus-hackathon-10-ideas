import { useRoomStore } from './roomStore';
import { guardedTransition } from './hooks/useRoomStateGuard';
import { v4 as nanoid } from 'uuid';
import { connectRealtime, type RealtimeConnection } from '@/lib/realtime';
import type { AgentPersona } from '@/lib/types';

// ─── Event handlers (backend → frontend) ────────────────────────────────────

export const roomEvents = {
  onAgentUtteranceStart: (agentId: string, fullText: string) => {
    const store = useRoomStore.getState();
    guardedTransition('AGENT_SPEAKING');
    store.setActiveAgent(agentId);
    store.setFloorOwner(agentId);
    store.resetSilence();

    const agent = store.agents.find(a => a.id === agentId);
    const lineId = nanoid();
    store.addTranscriptLine({
      id: lineId,
      speakerId: agentId,
      speakerName: agent?.name ?? agentId,
      isUser: false,
      text: '',
      isStreaming: true,
      timestamp: Date.now(),
    });

    // Simulate word-by-word streaming
    const words = fullText.split(' ');
    words.forEach((word, i) => {
      setTimeout(() => {
        useRoomStore.getState().appendTranscriptChunk(lineId, (i === 0 ? '' : ' ') + word);
        if (i === words.length - 1) {
          useRoomStore.getState().finalizeTranscriptLine(lineId);
          guardedTransition('AMBIENT');
          useRoomStore.getState().setActiveAgent(null);
          useRoomStore.getState().setFloorOwner(null);
        }
      }, i * 120);
    });
  },

  /** For real API: agent transcript arrives as a complete utterance */
  onAgentUtteranceFinal: (agentId: string, text: string) => {
    const store = useRoomStore.getState();
    const agent = store.agents.find(a => a.id === agentId);
    store.addTranscriptLine({
      id: nanoid(),
      speakerId: agentId,
      speakerName: agent?.name ?? agentId,
      isUser: false,
      text,
      isStreaming: false,
      timestamp: Date.now(),
    });
    guardedTransition('AMBIENT');
    store.setActiveAgent(null);
    store.setFloorOwner(null);
  },

  /** For real API: user transcript arrives from STT */
  onUserUtteranceFinal: (text: string) => {
    useRoomStore.getState().addTranscriptLine({
      id: nanoid(),
      speakerId: 'user',
      speakerName: 'You',
      isUser: true,
      text,
      isStreaming: false,
      timestamp: Date.now(),
    });
  },

  onEvalUpdate: (tone: number, content: number, firstVoice: number) => {
    useRoomStore.getState().updateEvalScore({ tone, content, firstVoice });
  },

  onSilenceWarning: (seconds: number) => {
    const store = useRoomStore.getState();
    if (seconds === 1) guardedTransition('SILENCE');
    store.tickSilence();
  },

  onSessionEnd: (scorePayload: unknown) => {
    guardedTransition('ENDING');
    setTimeout(() => {
      console.log('Navigate to debrief', scorePayload);
    }, 800);
  },

  // ─── Emitters (frontend → backend) ────────────────────────────────────────
  emitUserUtteranceStart: () => {
    guardedTransition('LEARNER_SPEAKING');
    useRoomStore.getState().setFloorOwner('user');
    useRoomStore.getState().resetSilence();
  },

  emitUserUtteranceEnd: (transcript: string) => {
    guardedTransition('PROCESSING');
    const store = useRoomStore.getState();
    store.addTranscriptLine({
      id: nanoid(),
      speakerId: 'user',
      speakerName: 'You',
      isUser: true,
      text: transcript,
      isStreaming: false,
      timestamp: Date.now(),
    });
    // Mock: after 1200ms, agent responds
    setTimeout(() => {
      const s = useRoomStore.getState();
      roomEvents.onEvalUpdate(
        Math.min(1, s.evalScore.tone + 0.08),
        Math.min(1, s.evalScore.content + 0.06),
        Math.min(1, s.evalScore.firstVoice + 0.1),
      );
      roomEvents.onAgentUtteranceStart(
        'emma',
        "That's a really interesting point. How long have you been working remotely?"
      );
    }, 1200);
  },

  emitInterrupt: () => {
    guardedTransition('LEARNER_SPEAKING');
  },

  emitSessionEnd: () => {
    roomEvents.onSessionEnd({ tone: 0.72, content: 0.65, firstVoice: 0.58 });
  },
};

// ─── Mock autoplay ──────────────────────────────────────────────────────────

let mockCleanedUp = false;

export function startMockSession() {
  mockCleanedUp = false;
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  // Session timer
  const timer = setInterval(() => {
    if (mockCleanedUp) return;
    useRoomStore.getState().tickSession();
  }, 1000);

  // CONNECTING → AMBIENT after 1.5s
  timeouts.push(setTimeout(() => {
    if (mockCleanedUp) return;
    guardedTransition('AMBIENT');

    // Agent opens after 1s in AMBIENT
    timeouts.push(setTimeout(() => {
      if (mockCleanedUp) return;
      roomEvents.onAgentUtteranceStart(
        'emma',
        "Thanks for hopping on the call. Let's get right into it — we've been discussing whether we should continue with remote work or move back to the office full-time. I'd love to hear your thoughts on what's been working well for you remotely."
      );
    }, 1000));
  }, 1500));

  return () => {
    mockCleanedUp = true;
    clearInterval(timer);
    timeouts.forEach(clearTimeout);
  };
}

// ─── Real API connection ────────────────────────────────────────────────────
// Adapts the existing realtime.ts WebRTC connection to the room event interface.
// Call this instead of startMockSession() when connecting to the real backend.

export async function connectRoomRealtime(
  agent: AgentPersona,
  scenarioContext: string,
  conversationBeats: string[],
): Promise<RealtimeConnection> {
  const store = useRoomStore.getState();

  // Session timer
  const timer = setInterval(() => {
    useRoomStore.getState().tickSession();
  }, 1000);

  const handleTranscript = (
    speaker: 'user' | 'agent',
    text: string,
    agentId: string,
    agentName: string,
  ) => {
    if (speaker === 'agent') {
      roomEvents.onAgentUtteranceFinal(agentId, text);
    } else {
      roomEvents.onUserUtteranceFinal(text);
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    if (connected) {
      guardedTransition('AMBIENT');
    }
  };

  const handleSpeakingChange = (speaking: boolean) => {
    const s = useRoomStore.getState();
    if (speaking) {
      guardedTransition('AGENT_SPEAKING');
      store.setActiveAgent(agent.id);
      store.setFloorOwner(agent.id);
      store.resetSilence();
    } else {
      if (s.roomState === 'AGENT_SPEAKING') {
        guardedTransition('AMBIENT');
        store.setActiveAgent(null);
        store.setFloorOwner(null);
      }
    }
  };

  const conn = await connectRealtime(
    agent,
    scenarioContext,
    conversationBeats,
    handleTranscript,
    handleConnectionChange,
    handleSpeakingChange,
  );

  // Wrap disconnect to also clean up the timer
  const originalDisconnect = conn.disconnect;
  conn.disconnect = () => {
    clearInterval(timer);
    originalDisconnect();
  };

  return conn;
}
