import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './room.css';
import { useRoomStore } from './roomStore';
import { roomEvents } from './roomEvents';
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
import { sessionsApi, topicsApi } from '../services/api';
import type { ServerEvent } from '../types';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function RoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const micInitRef = useRef(false);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { start: startMic, stop: stopMic } = useMicCapture();
  const { attach: attachVAD, detach: detachVAD } = useVAD();

  const [showEndModal, setShowEndModal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [scenarioContext, setScenarioContext] = useState('');

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

  // ─── Audio playback for agent speech ───────────────────────────────────────
  const playAudioBytes = useCallback(async (bytes: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    try {
      const buffer = await audioContextRef.current.decodeAudioData(bytes.slice(0));
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }, []);

  // ─── WebSocket event handler ───────────────────────────────────────────────
  const handleServerEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'session_state':
        if (event.status === 'active') {
          // Session started — transition to AMBIENT
          const store = useRoomStore.getState();
          if (store.roomState === 'CONNECTING') {
            store.setRoomState('AMBIENT');
          }
        }
        if (event.status === 'completed') {
          roomEvents.onSessionEnd();
          setTimeout(() => navigate(`/session/${sessionId}/debrief`), 800);
        }
        break;
      case 'character_speech_start':
        roomEvents.onAgentSpeechStart(event.character_id, event.character_name);
        break;
      case 'character_speech_end':
        roomEvents.onAgentSpeechEnd();
        break;
      case 'transcript_update':
        if (event.turn) {
          const turn = event.turn;
          if (turn.speaker === 'learner') {
            roomEvents.onUserUtteranceFinal(turn.text);
          } else {
            roomEvents.onAgentUtteranceFinal(
              turn.character_id || 'agent',
              turn.character_name || 'Agent',
              turn.text
            );
          }
        }
        break;
      case 'live_scores':
        roomEvents.onEvalUpdate(
          event.tone ?? 0,
          event.content ?? 0,
          event.first_voice ?? 0
        );
        break;
      case 'silence_warning':
        roomEvents.onSilenceWarning(useRoomStore.getState().silenceSeconds + 1);
        break;
    }
  }, [navigate, sessionId]);

  // ─── Initialize: fetch data + connect WebSocket ────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const store = useRoomStore.getState();
    store.reset();

    // Fetch session and topic data
    sessionsApi.get(sessionId).then(async (res) => {
      const session = res.data;
      try {
        const topicRes = await topicsApi.get(session.topic_id);
        const topic = topicRes.data;

        // Populate room store from topic data
        store.setWorldName(topic.title || 'Untitled World');
        setScenarioContext(topic.description || topic.domain_knowledge || '');

        // Map characters to agents
        const agentList = (topic.characters || []).map((char: any) => ({
          id: char.id,
          name: char.name,
          role: (char.role || 'ANCHOR').toUpperCase(),
          avatarColor: '#4a7ab5',
        }));
        store.setAgents(agentList);
      } catch {
        console.warn('Failed to load topic data');
      }
    }).catch(() => {
      console.warn('Failed to load session data');
    });

    // Connect WebSocket — pass JWT as query param (browsers can't set WS headers)
    const token = localStorage.getItem('token') || '';
    const wsUrl = `${WS_BASE}/api/v1/sessions/ws/session/${sessionId}?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('Room WebSocket connected');
      // Send start_session
      socket.send(JSON.stringify({ type: 'start_session' }));
    };

    socket.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then(playAudioBytes);
        return;
      }
      try {
        const msg: ServerEvent = JSON.parse(event.data);
        handleServerEvent(msg);
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    socket.onerror = (e) => console.error('WS error:', e);
    socket.onclose = () => {
      console.log('Room WebSocket closed');
    };

    // Session timer
    timerRef.current = setInterval(() => {
      useRoomStore.getState().tickSession();
    }, 1000);

    // If WebSocket fails to connect, fallback to AMBIENT after timeout
    const fallbackTimer = setTimeout(() => {
      const s = useRoomStore.getState();
      if (s.roomState === 'CONNECTING') {
        s.setRoomState('AMBIENT');
      }
    }, 5000);

    return () => {
      socket.close();
      wsRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(fallbackTimer);
    };
  }, [sessionId, handleServerEvent, playAudioBytes]);

  // ─── Start mic when entering AMBIENT for the first time ────────────────────
  useEffect(() => {
    if (roomState === 'AMBIENT' && !micInitRef.current) {
      micInitRef.current = true;
      startMic().then((source) => {
        attachVAD(source);

        // Also start MediaRecorder for sending audio over WebSocket
        const stream = source.mediaStream || (source as any).mediaStream;
        if (stream && wsRef.current) {
          try {
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                e.data.arrayBuffer().then((buf) => {
                  wsRef.current?.send(buf);
                });
              }
            };
            recorder.start(500);
            wsRef.current.send(JSON.stringify({ type: 'mic_active', active: true }));
          } catch {
            console.warn('MediaRecorder not available');
          }
        }
      }).catch((err) => {
        console.warn('Mic access denied:', err);
      });
    }
  }, [roomState, startMic, attachVAD]);

  // ─── Silence timer ─────────────────────────────────────────────────────────
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

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      detachVAD();
      stopMic();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [detachVAD, stopMic]);

  // ─── End session handler ───────────────────────────────────────────────────
  const handleEndSession = async () => {
    setShowEndModal(false);
    roomEvents.emitSessionEnd();

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Notify backend
    wsRef.current?.send(JSON.stringify({ type: 'end_session' }));
    try {
      await sessionsApi.end(sessionId!);
    } catch {}

    setTimeout(() => navigate(`/session/${sessionId}/debrief`), 800);
  };

  // ─── Mic toggle ────────────────────────────────────────────────────────────
  const handleMicToggle = () => {
    const newMuted = !micMuted;
    setMicMuted(newMuted);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mic_active', active: !newMuted }));
    }
  };

  const isEnding = roomState === 'ENDING';

  return (
    <div className={`room-page${isEnding ? ' ending' : ''}`}>
      {/* Layer 0: Scene */}
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
        onMicToggle={handleMicToggle}
        onEndSession={() => setShowEndModal(true)}
        onBriefingToggle={() => setShowBriefing(!showBriefing)}
      />

      {/* Briefing overlay */}
      {showBriefing && (
        <BriefingOverlay
          worldName={worldName}
          scenarioContext={scenarioContext}
          onClose={() => setShowBriefing(false)}
        />
      )}

      {/* End session modal */}
      {showEndModal && (
        <SessionEndModal
          onConfirm={handleEndSession}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
}
