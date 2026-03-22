import { useRef, useCallback } from 'react';

/**
 * Records a full conversation by mixing the user's microphone stream
 * and AI agent audio (received as ArrayBuffers) into a single MediaRecorder.
 */
export function useConversationRecorder() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isRecordingRef = useRef(false);

  /** Get or create the AudioContext and mix destination, resuming if suspended */
  const ensureContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    // Browsers suspend AudioContext until a user gesture — resume it
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    if (!mixDestRef.current) {
      mixDestRef.current = audioContextRef.current.createMediaStreamDestination();
    }
    return { ctx: audioContextRef.current, mixDest: mixDestRef.current };
  }, []);

  /**
   * Start recording. Call this with the user's mic stream.
   * The mic audio will be routed into the mix bus for recording.
   */
  const startRecording = useCallback(async (micStream: MediaStream) => {
    const { ctx, mixDest } = await ensureContext();

    // Connect mic to mix bus (for recording only — mic playback is not needed)
    const micSource = ctx.createMediaStreamSource(micStream);
    micSource.connect(mixDest);
    micSourceRef.current = micSource;

    // Start MediaRecorder on the mix bus stream
    chunksRef.current = [];
    const recorder = new MediaRecorder(mixDest.stream, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(1000); // collect in 1s chunks
    recorderRef.current = recorder;
    isRecordingRef.current = true;
  }, [ensureContext]);

  /**
   * Feed agent audio into the mix bus AND play it through speakers.
   * Returns a promise that resolves when the audio finishes playing.
   */
  const feedAgentAudio = useCallback(async (audioBytes: ArrayBuffer): Promise<AudioBufferSourceNode | null> => {
    const { ctx, mixDest } = await ensureContext();

    try {
      const buffer = await ctx.decodeAudioData(audioBytes.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Connect to speakers (so the user hears it)
      source.connect(ctx.destination);

      // Connect to mix bus (so it gets recorded)
      if (isRecordingRef.current && mixDest) {
        source.connect(mixDest);
      }

      source.start();
      return source;
    } catch (e) {
      console.error('feedAgentAudio error:', e);
      return null;
    }
  }, [ensureContext]);

  /**
   * Stop recording and return the combined audio as a Blob.
   */
  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(new Blob(chunksRef.current, { type: 'audio/webm' }));
        isRecordingRef.current = false;
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        isRecordingRef.current = false;
        resolve(blob);
      };
      recorder.stop();

      // Disconnect mic from mix bus
      if (micSourceRef.current) {
        micSourceRef.current.disconnect();
        micSourceRef.current = null;
      }
    });
  }, []);

  return {
    startRecording,
    stopRecording,
    feedAgentAudio,
    isRecording: isRecordingRef,
  };
}
