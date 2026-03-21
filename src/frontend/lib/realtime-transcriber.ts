/**
 * OpenAI Realtime API client for speech-to-text transcription only.
 *
 * Flow:
 * 1. Fetch ephemeral token from /api/realtime-token (config baked in)
 * 2. Connect to wss://api.openai.com/v1/realtime?intent=transcription
 * 3. No session.update needed — config is in the token
 * 4. Capture mic audio via AudioWorklet → PCM16 base64 → stream to OpenAI
 * 5. Receive transcription events → fire onTranscript callback
 */

export type TranscriberState = "idle" | "connecting" | "listening" | "error";

export class RealtimeTranscriber {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  /** Called with the final transcript text when user finishes speaking */
  onTranscript: ((text: string) => void) | null = null;

  /** Called with partial/streaming transcript delta */
  onPartial: ((text: string) => void) | null = null;

  /** Called when transcriber state changes */
  onStateChange: ((state: TranscriberState) => void) | null = null;

  /** Called when speech is detected starting */
  onSpeechStart: (() => void) | null = null;

  /** Called when speech stops (silence detected) */
  onSpeechStop: (() => void) | null = null;

  /** Called on errors with a user-visible message */
  onError: ((message: string) => void) | null = null;

  private setState(state: TranscriberState) {
    this.onStateChange?.(state);
  }

  async start(): Promise<void> {
    if (this.ws) return;

    this.setState("connecting");

    try {
      // 1. Get ephemeral token (session config baked in)
      console.log("[Transcriber] Fetching token...");
      const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("[Transcriber] Token fetch failed:", tokenRes.status, errBody);
        throw new Error(`Token fetch failed: ${tokenRes.status}`);
      }
      const tokenData = await tokenRes.json();
      console.log("[Transcriber] Token response:", Object.keys(tokenData));
      const token = tokenData.token;
      if (!token) {
        console.error("[Transcriber] No token in response:", tokenData);
        throw new Error(tokenData.error || "No token returned");
      }

      // 2. Connect — no session.update needed, config is in the token
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?intent=transcription",
        ["realtime", `openai-insecure-api-key.${token}`]
      );

      this.ws = ws;

      ws.onopen = () => {
        console.log("[Transcriber] WebSocket connected, starting mic...");
        this.startMicrophone();
      };

      ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      ws.onerror = (ev) => {
        console.error("[Transcriber] WebSocket error:", ev);
        this.onError?.("WebSocket connection failed");
        this.setState("error");
      };

      ws.onclose = (ev) => {
        console.log("[Transcriber] WebSocket closed:", ev.code, ev.reason);
        this.cleanupAudio();
        this.ws = null;
        this.setState("idle");
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Transcriber] Start error:", message);
      this.onError?.(message);
      this.setState("error");
      this.stop();
    }
  }

  stop(): void {
    this.cleanupAudio();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState("idle");
  }

  private handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case "session.created":
      case "session.updated":
      case "transcription_session.created":
      case "transcription_session.updated":
        console.log("[Transcriber] Session ready:", msg.type);
        this.setState("listening");
        break;

      case "input_audio_buffer.speech_started":
        this.onSpeechStart?.();
        break;

      case "input_audio_buffer.speech_stopped":
        this.onSpeechStop?.();
        break;

      case "conversation.item.input_audio_transcription.delta":
        if (typeof msg.delta === "string" && msg.delta.trim()) {
          this.onPartial?.(msg.delta);
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (typeof msg.transcript === "string" && msg.transcript.trim()) {
          this.onTranscript?.(msg.transcript.trim());
        }
        break;

      case "error":
        console.error("Realtime API error:", msg.error);
        break;
    }
  }

  private async startMicrophone(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      await this.audioContext.audioWorklet.addModule("/audioProcessor.js");

      this.sourceNode = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        "audio-processor"
      );

      this.sourceNode.connect(this.workletNode);
      // AudioWorklet needs a destination to keep the pipeline alive
      this.workletNode.connect(this.audioContext.destination);

      this.workletNode.port.onmessage = (event) => {
        const float32: Float32Array = event.data.audio;
        if (
          float32 &&
          float32.length > 0 &&
          this.ws?.readyState === WebSocket.OPEN
        ) {
          const base64 = float32ToBase64Pcm16(float32);
          this.ws.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: base64,
            })
          );
        }
      };
    } catch (err) {
      console.error("Microphone error:", err);
      this.onError?.("Microphone access denied or unavailable");
      this.setState("error");
    }
  }

  private cleanupAudio(): void {
    this.workletNode?.disconnect();
    this.sourceNode?.disconnect();
    this.workletNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Convert Float32Array audio samples to base64-encoded PCM16 (little-endian).
 */
function float32ToBase64Pcm16(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...Array.from(bytes.subarray(i, i + chunkSize))
    );
  }
  return btoa(binary);
}
