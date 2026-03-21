'use client';

import { useEffect, useRef, useState } from 'react';
import './room.css';
import { useRoomStore } from './roomStore';
import { startMockSession, roomEvents } from './roomEvents';
import { useMicCapture } from './hooks/useMicCapture';
import { useVAD } from './hooks/useVAD';
import { SceneCanvas } from './components/SceneCanvas';
import { TopBarOverlay } from './components/TopBarOverlay';
import { AgentNameplate } from './components/AgentNameplate';
import { EvalHUD } from './components/EvalHUD';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ParticipantRail } from './components/ParticipantRail';
import { SessionEndModal } from './components/SessionEndModal';
import { BriefingOverlay } from './components/BriefingOverlay';

export function RoomPage() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const micInitRef = useRef(false);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { start: startMic, stop: stopMic } = useMicCapture();
  const { attach: attachVAD, detach: detachVAD } = useVAD();

  const [showEndModal, setShowEndModal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  // Store selectors
  const worldName = useRoomStore(s => s.worldName);
  const roomState = useRoomStore(s => s.roomState);
  const sessionElapsed = useRoomStore(s => s.sessionElapsed);
  const activeAgentId = useRoomStore(s => s.activeAgentId);
  const floorOwnerId = useRoomStore(s => s.floorOwnerId);
  const agents = useRoomStore(s => s.agents);
  const transcript = useRoomStore(s => s.transcript);
  const evalScore = useRoomStore(s => s.evalScore);
  const transcriptPanelOpen = useRoomStore(s => s.transcriptPanelOpen);
  const micMuted = useRoomStore(s => s.micMuted);
  const isMicActive = useRoomStore(s => s.isMicActive);
  const silenceSeconds = useRoomStore(s => s.silenceSeconds);

  const toggleTranscriptPanel = useRoomStore(s => s.toggleTranscriptPanel);
  const setMicMuted = useRoomStore(s => s.setMicMuted);

  // Derive agent nameplate info
  const activeAgent = agents.find(a => a.id === activeAgentId);
  const showNameplate = roomState === 'AGENT_SPEAKING' || roomState === 'LEARNER_SPEAKING';
  const nameplateName = roomState === 'LEARNER_SPEAKING' ? 'You' : (activeAgent?.name ?? '');
  const nameplateRole = roomState === 'LEARNER_SPEAKING' ? '' : (activeAgent?.role ?? '');

  // Reset store and start mock session on mount
  useEffect(() => {
    useRoomStore.getState().reset();
    cleanupRef.current = startMockSession();
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  // Start mic when entering AMBIENT for the first time
  useEffect(() => {
    if (roomState === 'AMBIENT' && !micInitRef.current) {
      micInitRef.current = true;
      startMic().then((source) => {
        attachVAD(source);
      }).catch((err) => {
        console.warn('Mic access denied:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState]);

  // Silence timer: when AMBIENT, start counting; at 10s, trigger scaffold prompt
  useEffect(() => {
    if (roomState === 'AMBIENT') {
      silenceIntervalRef.current = setInterval(() => {
        const { roomState: currentState, silenceSeconds: currentSilence } = useRoomStore.getState();
        if (currentState !== 'AMBIENT') {
          if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
          useRoomStore.getState().resetSilence();
          return;
        }
        roomEvents.onSilenceWarning(currentSilence + 1);

        // At 10s: trigger scaffold prompt from Anchor
        if (currentSilence + 1 >= 10) {
          if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
          useRoomStore.getState().resetSilence();
          roomEvents.onAgentUtteranceStart(
            'emma',
            "Take your time — what's on your mind?"
          );
        }
      }, 1000);
    } else {
      if (silenceIntervalRef.current) {
        clearInterval(silenceIntervalRef.current);
        silenceIntervalRef.current = null;
      }
      useRoomStore.getState().resetSilence();
    }

    return () => {
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    };
  }, [roomState]);

  // Cleanup mic on unmount
  useEffect(() => {
    return () => {
      detachVAD();
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEnding = roomState === 'ENDING';

  return (
    <div className={`room-page${isEnding ? ' ending' : ''}`}>
      {/* Layer 0: 3D Scene */}
      <SceneCanvas />

      {/* Layer 1: All UI overlays */}
      <TopBarOverlay
        worldName={worldName}
        isConnecting={roomState === 'CONNECTING'}
        sessionElapsed={sessionElapsed}
      />

      <AgentNameplate
        name={nameplateName}
        role={nameplateRole}
        visible={showNameplate}
      />

      <EvalHUD
        tone={evalScore.tone}
        content={evalScore.content}
        firstVoice={evalScore.firstVoice}
      />

      <TranscriptPanel
        transcript={transcript}
        isOpen={transcriptPanelOpen}
        onToggle={toggleTranscriptPanel}
      />

      <ParticipantRail
        agents={agents}
        floorOwnerId={floorOwnerId}
        isMicActive={isMicActive}
        micMuted={micMuted}
        roomState={roomState}
        silenceSeconds={silenceSeconds}
        onMicToggle={() => setMicMuted(!micMuted)}
        onEndSession={() => setShowEndModal(true)}
        onBriefingToggle={() => setShowBriefing(!showBriefing)}
      />

      {/* Briefing overlay */}
      {showBriefing && (
        <BriefingOverlay
          worldName={worldName}
          scenarioContext="You are in a remote team meeting discussing the future of your company's work arrangement. The team has been working remotely for two years and management is considering various hybrid models."
          onClose={() => setShowBriefing(false)}
        />
      )}

      {/* End session modal */}
      {showEndModal && (
        <SessionEndModal
          onConfirm={() => {
            setShowEndModal(false);
            roomEvents.emitSessionEnd();
          }}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
}
