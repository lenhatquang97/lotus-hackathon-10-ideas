import { useRef, useCallback } from 'react';
import { roomEvents } from '../roomEvents';
import { useRoomStore } from '../roomStore';

interface VADConfig {
  rmsThreshold?: number;
  onFrames?: number;
  offFrames?: number;
  frameMs?: number;
}

export function useVAD(config: VADConfig = {}) {
  const {
    rmsThreshold = 0.015,
    onFrames = 3,
    offFrames = 8,
    frameMs = 20,
  } = config;

  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isSpeakingRef = useRef(false);
  const onCountRef = useRef(0);
  const offCountRef = useRef(0);
  const audioChunksRef = useRef<Float32Array[]>([]);

  const attach = useCallback((source: MediaStreamAudioSourceNode) => {
    const ctx = source.context as AudioContext;
    const bufferSize = Math.round(ctx.sampleRate * (frameMs / 1000));

    const processor = ctx.createScriptProcessor(bufferSize, 1, 1);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);

      // Collect raw audio for STT (Phase 5)
      if (isSpeakingRef.current) {
        audioChunksRef.current.push(new Float32Array(input));
      }

      // RMS energy
      let sum = 0;
      for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
      const rms = Math.sqrt(sum / input.length);

      const { roomState, micMuted } = useRoomStore.getState();

      // Only activate VAD when appropriate
      if (
        roomState === 'AGENT_SPEAKING' ||
        roomState === 'CONNECTING' ||
        roomState === 'ENDING' ||
        micMuted
      ) {
        return;
      }

      if (rms > rmsThreshold) {
        offCountRef.current = 0;
        onCountRef.current++;
        if (!isSpeakingRef.current && onCountRef.current >= onFrames) {
          isSpeakingRef.current = true;
          audioChunksRef.current = [];
          useRoomStore.getState().setMicActive(true);
          roomEvents.emitUserUtteranceStart();
        }
      } else {
        onCountRef.current = 0;
        offCountRef.current++;
        if (isSpeakingRef.current && offCountRef.current >= offFrames) {
          isSpeakingRef.current = false;
          useRoomStore.getState().setMicActive(false);
          // Phase 5: pass audioChunksRef.current to STT service
          // Phase 3 placeholder:
          roomEvents.emitUserUtteranceEnd('[speech recognized here]');
          audioChunksRef.current = [];
        }
      }
    };

    source.connect(processor);
    processor.connect(ctx.destination);
    processorRef.current = processor;
  }, [rmsThreshold, onFrames, offFrames, frameMs]);

  const detach = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
  }, []);

  return { attach, detach };
}
