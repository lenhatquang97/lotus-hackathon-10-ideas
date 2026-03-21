import { useRoomStore } from './roomStore';
import { guardedTransition } from './hooks/useRoomStateGuard';

let lineIdCounter = 0;
function nextLineId() {
  return `line-${Date.now()}-${++lineIdCounter}`;
}

// ─── Event handlers (backend → frontend) ────────────────────────────────────

export const roomEvents = {
  onAgentUtteranceStart: (agentId: string, fullText: string) => {
    const store = useRoomStore.getState();
    guardedTransition('AGENT_SPEAKING');
    store.setActiveAgent(agentId);
    store.setFloorOwner(agentId);
    store.resetSilence();

    const agent = store.agents.find(a => a.id === agentId);
    const lineId = nextLineId();
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

  /** Agent transcript arrives as a complete utterance (from WebSocket) */
  onAgentUtteranceFinal: (agentId: string, agentName: string, text: string) => {
    const store = useRoomStore.getState();
    store.addTranscriptLine({
      id: nextLineId(),
      speakerId: agentId,
      speakerName: agentName,
      isUser: false,
      text,
      isStreaming: false,
      timestamp: Date.now(),
    });
    // Transition back to AMBIENT if currently in AGENT_SPEAKING
    if (store.roomState === 'AGENT_SPEAKING') {
      guardedTransition('AMBIENT');
      store.setActiveAgent(null);
      store.setFloorOwner(null);
    }
  },

  /** User transcript arrives from STT (via WebSocket) */
  onUserUtteranceFinal: (text: string) => {
    useRoomStore.getState().addTranscriptLine({
      id: nextLineId(),
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

  onSessionEnd: () => {
    guardedTransition('ENDING');
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
      id: nextLineId(),
      speakerId: 'user',
      speakerName: 'You',
      isUser: true,
      text: transcript,
      isStreaming: false,
      timestamp: Date.now(),
    });
    // After processing, return to AMBIENT
    setTimeout(() => {
      guardedTransition('AMBIENT');
    }, 500);
  },

  emitInterrupt: () => {
    guardedTransition('LEARNER_SPEAKING');
  },

  emitSessionEnd: () => {
    roomEvents.onSessionEnd();
  },

  /** Handle agent speaking state from WebSocket */
  onAgentSpeechStart: (agentId: string, agentName: string) => {
    const store = useRoomStore.getState();
    guardedTransition('AGENT_SPEAKING');
    store.setActiveAgent(agentId);
    store.setFloorOwner(agentId);
    store.resetSilence();
  },

  onAgentSpeechEnd: () => {
    const store = useRoomStore.getState();
    if (store.roomState === 'AGENT_SPEAKING') {
      guardedTransition('AMBIENT');
      store.setActiveAgent(null);
      store.setFloorOwner(null);
    }
  },
};
