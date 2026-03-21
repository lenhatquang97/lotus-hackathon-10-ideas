import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { ServerEvent } from '../types';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useSessionSocket(sessionId: string) {
  const ws = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const isAgentSpeaking = useRef(false);
  const store = useSessionStore();

  /** Stop any currently playing agent audio immediately */
  const stopAgentAudio = useCallback(() => {
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
      } catch {
        // already stopped
      }
      currentAudioSource.current = null;
    }
    isAgentSpeaking.current = false;
  }, []);

  const playAudioBytes = useCallback(async (bytes: ArrayBuffer) => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    try {
      const buffer = await audioContext.current.decodeAudioData(bytes.slice(0));
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.current.destination);

      // Track the source so we can stop it on barge-in
      currentAudioSource.current = source;
      isAgentSpeaking.current = true;

      source.onended = () => {
        if (currentAudioSource.current === source) {
          currentAudioSource.current = null;
          isAgentSpeaking.current = false;
        }
      };

      source.start();
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }, []);

  /** Called by VAD when user starts speaking - triggers barge-in */
  const onUserSpeechStart = useCallback(() => {
    if (isAgentSpeaking.current) {
      console.log('[VAD] Barge-in: user started speaking, stopping agent audio');
      stopAgentAudio();
      // Notify backend to cancel any in-progress generation
      ws.current?.send(JSON.stringify({ type: 'barge_in' }));
    }
  }, [stopAgentAudio]);

  /** Called by VAD when user stops speaking - trigger processing */
  const onUserSpeechEnd = useCallback(() => {
    if (store.isMicActive && ws.current?.readyState === WebSocket.OPEN) {
      // Signal the backend that the user finished a speech segment
      ws.current.send(JSON.stringify({ type: 'mic_active', active: false }));
      // Re-arm for next speech segment
      ws.current.send(JSON.stringify({ type: 'mic_active', active: true }));
    }
  }, [store.isMicActive]);

  const handleServerEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'session_state':
        if (event.status === 'active') store.setSessionActive(true);
        if (event.status === 'completed') store.setSessionActive(false);
        break;
      case 'character_speech_start':
        store.setActiveSpeaker({ character_id: event.character_id, character_name: event.character_name });
        break;
      case 'character_speech_end':
        store.setActiveSpeaker(null);
        break;
      case 'transcript_update':
        store.addTranscriptTurn(event.turn);
        break;
      case 'live_scores':
        store.setLiveScores({ tone: event.tone, content: event.content, first_voice: event.first_voice });
        break;
      case 'silence_warning':
        store.setShowSilenceOverlay(true);
        setTimeout(() => store.setShowSilenceOverlay(false), 5000);
        break;
    }
  }, [store]);

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = `${WS_BASE}/api/v1/sessions/ws/session/${sessionId}`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;
    store.setWsRef(socket);

    socket.onopen = () => {
      console.log('WebSocket connected');
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
      store.setWsRef(null);
      store.setSessionActive(false);
    };

    return () => {
      socket.close();
      store.setWsRef(null);
    };
  }, [sessionId]);

  const startSession = useCallback(() => {
    ws.current?.send(JSON.stringify({ type: 'start_session' }));
  }, []);

  const endSession = useCallback(() => {
    ws.current?.send(JSON.stringify({ type: 'end_session' }));
    stopRecording();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.current?.readyState === WebSocket.OPEN) {
          e.data.arrayBuffer().then((buf) => {
            ws.current?.send(buf);
          });
        }
      };

      recorder.start(500);
      store.setMicActive(true);
      ws.current?.send(JSON.stringify({ type: 'mic_active', active: true }));
    } catch (e) {
      console.error('Mic error:', e);
    }
  }, [store]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
    }
    store.setMicActive(false);
    ws.current?.send(JSON.stringify({ type: 'mic_active', active: false }));
  }, [store]);

  const toggleMic = useCallback(() => {
    if (store.isMicActive) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [store.isMicActive, startRecording, stopRecording]);

  return {
    startSession,
    endSession,
    toggleMic,
    startRecording,
    stopRecording,
    stopAgentAudio,
    onUserSpeechStart,
    onUserSpeechEnd,
  };
}
