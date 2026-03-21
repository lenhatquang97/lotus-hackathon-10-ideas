import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './room.css';
import { useRoomStore } from './roomStore';
import { roomEvents } from './roomEvents';
import { SceneCanvas } from './components/SceneCanvas';
import { TopBarOverlay } from './components/TopBarOverlay';
import { AgentNameplate } from './components/AgentNameplate';
import { EvalHUD } from './components/EvalHUD';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ParticipantRail } from './components/ParticipantRail';
import { SessionEndModal } from './components/SessionEndModal';
import { BriefingOverlay } from './components/BriefingOverlay';
import { sessionsApi, topicsApi } from '../services/api';
import type { RoomManager } from '../lib/room-manager';
import type { ServerEvent } from '../types';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

interface RoomPageProps {
  /** When provided, run in "world" mode (3D avatars + Scribe STT via /ws/room/:topicId) */
  topicId?: string;
}

export function RoomPage({ topicId: topicIdProp }: RoomPageProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const roomManagerRef = useRef<RoomManager | null>(null);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Mode: "world" (topicId) or "session" (sessionId)
  const isWorldMode = !!topicIdProp;

  const [showEndModal, setShowEndModal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [scenarioContext, setScenarioContext] = useState('');
  const [sceneLoading, setSceneLoading] = useState(true);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('Initializing...');

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

  // ─── Audio playback for agent speech (session mode) ─────────────────────────
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

  // ─── Session-mode WebSocket event handler ───────────────────────────────────
  const handleServerEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'session_state':
        if (event.status === 'active') {
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

  // ─── 3D Scene ready callback (world mode) ───────────────────────────────────
  const handleSceneReady = useCallback((room: RoomManager) => {
    roomManagerRef.current = room;
    setSceneLoading(false);

    if (isWorldMode) {
      const store = useRoomStore.getState();
      store.setRoomState('AMBIENT');
      store.setMicActive(true);

      // Connect RoomManager WS to /ws/room/:topicId
      room.connectWebSocket((entry) => {
        // Bridge VirtualRoom transcript → roomStore transcript
        store.addTranscriptLine({
          id: `vr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          speakerId: entry.role === 'user' ? 'user' : entry.speaker,
          speakerName: entry.speaker,
          isUser: entry.role === 'user',
          text: entry.message,
          isStreaming: false,
          timestamp: Date.now(),
        });

        // Update room state based on who's speaking
        if (entry.role === 'agent') {
          store.setRoomState('AGENT_SPEAKING');
          store.setFloorOwner(entry.speaker);
        }
      }, topicIdProp);

      // Wire up partial transcript → streaming transcript line in store
      let partialLineId: string | null = null;
      room.onPartialTranscript = (text: string) => {
        const s = useRoomStore.getState();
        if (text) {
          if (!partialLineId) {
            partialLineId = `partial-${Date.now()}`;
            s.addTranscriptLine({
              id: partialLineId,
              speakerId: 'user',
              speakerName: 'You',
              isUser: true,
              text,
              isStreaming: true,
              timestamp: Date.now(),
            });
            s.setRoomState('LEARNER_SPEAKING');
            s.setFloorOwner('user');
          } else {
            // Update the existing partial line
            s.appendTranscriptChunk(partialLineId, '');
            // Replace full text by removing old and adding new
            const lines = s.transcript.map(l =>
              l.id === partialLineId ? { ...l, text } : l
            );
            useRoomStore.setState({ transcript: lines });
          }
        } else {
          // Partial cleared → finalize the streaming line
          if (partialLineId) {
            s.finalizeTranscriptLine(partialLineId);
            partialLineId = null;
            s.setRoomState('AMBIENT');
            s.setFloorOwner(null);
          }
        }
      };

      // Wire up barge-in
      room.onUserSpeechStart = () => {
        room.stopSpeaking();
      };

      // Auto-start Scribe recording
      room.startRecording().catch(err => {
        console.warn('Failed to start Scribe recording:', err);
      });
    }
  }, [isWorldMode, topicIdProp]);

  const handleSceneError = useCallback((err: Error) => {
    setSceneError(err.message);
    setSceneLoading(false);
  }, []);

  const handleSceneProgress = useCallback((stage: string, _percent: number) => {
    setLoadingStage(stage);
  }, []);

  // ─── Initialize: session-mode (fetch data + connect WS) ────────────────────
  useEffect(() => {
    const store = useRoomStore.getState();
    store.reset();

    if (isWorldMode) {
      // World mode: set world name from topicId, RoomManager handles WS
      store.setWorldName(topicIdProp || 'World');

      // Fetch topic info for world name
      if (topicIdProp) {
        topicsApi.get(topicIdProp).then(res => {
          const topic = res.data;
          store.setWorldName(topic.title || 'World');
          setScenarioContext(topic.description || topic.domain_knowledge || '');

          const agentList = (topic.characters || []).map((char: any) => ({
            id: char.id || char.name,
            name: char.name,
            role: (char.role || 'ANCHOR').toUpperCase(),
            avatarColor: '#4a7ab5',
          }));
          store.setAgents(agentList);
        }).catch(() => {
          console.warn('Failed to load topic data');
        });
      }

      // Session timer
      timerRef.current = setInterval(() => {
        useRoomStore.getState().tickSession();
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        roomManagerRef.current?.stopRecording();
        roomManagerRef.current?.dispose();
      };
    }

    // Session mode (existing behavior)
    if (!sessionId) return;

    sessionsApi.get(sessionId).then(async (res) => {
      const session = res.data;
      try {
        const topicRes = await topicsApi.get(session.topic_id);
        const topic = topicRes.data;
        store.setWorldName(topic.title || 'Untitled World');
        setScenarioContext(topic.description || topic.domain_knowledge || '');

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

    // Connect session WebSocket
    const token = localStorage.getItem('token') || '';
    const wsUrl = `${WS_BASE}/api/v1/sessions/ws/session/${sessionId}?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('Room WebSocket connected');
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
    socket.onclose = () => console.log('Room WebSocket closed');

    timerRef.current = setInterval(() => {
      useRoomStore.getState().tickSession();
    }, 1000);

    const fallbackTimer = setTimeout(() => {
      const s = useRoomStore.getState();
      if (s.roomState === 'CONNECTING') s.setRoomState('AMBIENT');
    }, 5000);

    return () => {
      socket.close();
      wsRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(fallbackTimer);
    };
  }, [sessionId, topicIdProp, isWorldMode, handleServerEvent, playAudioBytes]);

  // ─── Silence timer ──────────────────────────────────────────────────────────
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

  // ─── End session handler ────────────────────────────────────────────────────
  const handleEndSession = async () => {
    setShowEndModal(false);
    roomEvents.emitSessionEnd();

    if (isWorldMode) {
      roomManagerRef.current?.stopRecording();
      roomManagerRef.current?.dispose();
      navigate('/');
      return;
    }

    wsRef.current?.send(JSON.stringify({ type: 'end_session' }));
    try {
      await sessionsApi.end(sessionId!);
    } catch {}
    setTimeout(() => navigate(`/session/${sessionId}/debrief`), 800);
  };

  // ─── Mic toggle ─────────────────────────────────────────────────────────────
  const handleMicToggle = () => {
    const newMuted = !micMuted;
    setMicMuted(newMuted);

    if (isWorldMode) {
      if (newMuted) {
        roomManagerRef.current?.stopRecording();
        useRoomStore.getState().setMicActive(false);
      } else {
        roomManagerRef.current?.startRecording().then(() => {
          useRoomStore.getState().setMicActive(true);
        });
      }
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mic_active', active: !newMuted }));
    }
  };

  const isEnding = roomState === 'ENDING';

  return (
    <div className={`room-page${isEnding ? ' ending' : ''}`}>
      {/* Layer 0: 3D Scene */}
      <SceneCanvas
        onReady={handleSceneReady}
        onError={handleSceneError}
        onProgress={handleSceneProgress}
      />

      {/* Loading overlay for 3D scene */}
      {sceneLoading && (
        <div className="scene-loading-overlay">
          <div className="scene-loading-content">
            <div className="scene-loading-spinner" />
            <p className="scene-loading-text">{loadingStage}</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {sceneError && (
        <div className="scene-loading-overlay">
          <div className="scene-loading-content">
            <p style={{ color: '#f97316', marginBottom: '12px' }}>Failed to load 3D scene</p>
            <p style={{ color: '#6B6B6B', fontSize: '12px' }}>{sceneError}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: '16px', padding: '8px 20px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

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
