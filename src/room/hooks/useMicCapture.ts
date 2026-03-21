import { useEffect, useRef } from 'react';

export function useMicCapture() {
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  const start = async (): Promise<MediaStreamAudioSourceNode> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
      },
    });
    streamRef.current = stream;
    const ctx = new AudioContext({ sampleRate: 16000 });
    contextRef.current = ctx;
    return ctx.createMediaStreamSource(stream);
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    contextRef.current?.close();
    streamRef.current = null;
    contextRef.current = null;
  };

  useEffect(() => () => stop(), []);

  return { start, stop, streamRef, contextRef };
}
