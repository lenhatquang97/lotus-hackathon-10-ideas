import type { Speaker, TranscriptEntry } from "./types";

// TalkingHead is an ESM module, we import its type loosely
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TalkingHeadInstance = any;

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "";
const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

/** Pre-import the lipsync-en module so we can inject it into TalkingHead instances.
 *  TalkingHead uses `import("./lipsync-en.mjs")` internally which Vite can't resolve. */
async function loadLipsyncEn() {
  // @ts-expect-error — direct path import for Vite bundling
  const mod = await import("@met4citizen/talkinghead/modules/lipsync-en.mjs");
  return new mod.LipsyncEn();
}

export class RoomManager {
  private alice: TalkingHeadInstance = null;
  private john: TalkingHeadInstance = null;
  private container: HTMLDivElement;
  private initialized = false;
  private ws: WebSocket | null = null;
  private onTranscript: ((entry: TranscriptEntry) => void) | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording = false;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  async init(onProgress?: (stage: string, percent: number) => void) {
    if (this.initialized) return;

    onProgress?.("Loading modules...", 5);

    // Dynamic import of TalkingHead (ESM module) and lipsync processor
    const [{ TalkingHead }, lipsyncEn] = await Promise.all([
      import("@met4citizen/talkinghead"),
      loadLipsyncEn(),
    ]);

    onProgress?.("Modules loaded", 15);

    // Alice: standalone instance — owns the scene, renderer, camera
    this.alice = new TalkingHead(this.container, {
      ttsEndpoint: "/api/tts",
      lipsyncModules: [],
      cameraView: "full",
      cameraDistance: 0,
      cameraX: 0,
      cameraY: 0,
      cameraRotateEnable: false,
      cameraZoomEnable: false,
      cameraPanEnable: false,
      modelPixelRatio: 1,
      modelFPS: 30,
      lightAmbientColor: "#fff5e6",
      lightAmbientIntensity: 2.5,
      lightDirectColor: "#ffffff",
      lightDirectIntensity: 1.5,
      lightSpotColor: "#ffffff",
      lightSpotIntensity: 0,
      update: (dt: number) => {
        this.john?.animate(dt);
      },
    });

    this.alice.lipsync = { en: lipsyncEn };
    this.alice.scene.background = null;

    onProgress?.("Loading Alice avatar...", 25);

    await this.alice.showAvatar({
      url: "/avatars/alice.glb",
      body: "F",
      avatarMood: "neutral",
      ttsLang: "en-US",
      ttsVoice: "en-US-Standard-C",
      lipsyncLang: "en",
      avatarIdleEyeContact: 0.7,
      avatarSpeakingEyeContact: 0.8,
    });

    this.alice.playPose("sitting");

    onProgress?.("Alice loaded", 50);

    // John: avatarOnly instance
    this.john = new TalkingHead(this.container, {
      ttsEndpoint: "/api/tts",
      lipsyncModules: [],
      avatarOnly: true,
      avatarOnlyCamera: this.alice.camera,
    });

    this.john.lipsync = { en: lipsyncEn };

    onProgress?.("Loading John avatar...", 55);

    await this.john.showAvatar({
      url: "/avatars/john.glb",
      body: "M",
      avatarMood: "neutral",
      ttsLang: "en-US",
      ttsVoice: "en-US-Standard-B",
      lipsyncLang: "en",
      avatarIdleEyeContact: 0.7,
      avatarSpeakingEyeContact: 0.8,
    });

    this.john.playPose("sitting");

    onProgress?.("John loaded", 80);

    // Position avatars
    if (this.alice.armature) {
      this.alice.armature.position.set(-0.5, 0, 0);
      this.alice.armature.rotation.set(0, 0.3, 0);
    }

    this.john.armature.position.set(0.4, 0, 0);
    this.john.armature.rotation.set(0, -0.3, 0);

    this.alice.scene.add(this.john.armature);

    this.alice.speakTo = this.john;
    this.john.speakTo = this.alice;

    this.alice.setView("mid", {
      cameraDistance: 0,
      cameraX: 0,
      cameraY: -0.5,
    });

    onProgress?.("Setting up scene...", 90);

    await new Promise((resolve) => setTimeout(resolve, 3500));

    onProgress?.("Ready!", 100);
    this.initialized = true;
  }

  /** Connect to the llm-room conversational AI service WebSocket. */
  connectWebSocket(onTranscript: (entry: TranscriptEntry) => void, topicId?: string) {
    this.onTranscript = onTranscript;

    // Connect to llm-room service via Vite proxy
    const path = topicId ? `/ws/room/${topicId}` : `/ws/room`;
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}${path}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "speak") {
        this.handleRemoteSpeak(data.name as Speaker, data.text);
      } else if (data.type === "waiting_for_user") {
        // The conversation is waiting for user input
        this.onTranscript?.({
          speaker: "system",
          role: "system",
          message: `${data.speaker} is waiting for your response...`,
          timestamp: new Date(),
        });
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => {
        if (this.initialized) {
          this.connectWebSocket(onTranscript, topicId);
        }
      }, 2000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  /** Handle a speak command from the llm-room service. */
  private handleRemoteSpeak(speaker: Speaker, text: string) {
    // Match speaker name (llm-room sends lowercase character names)
    const head = this.getHeadBySpeaker(speaker);
    if (!head) return;

    this.onTranscript?.({ speaker, role: "agent", message: text, timestamp: new Date() });

    head.speakText(text);
    head.speakMarker(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "speak_done", name: speaker }));
      }
    });
  }

  /** Find the TalkingHead instance by speaker name (case-insensitive). */
  private getHeadBySpeaker(speaker: string): TalkingHeadInstance | null {
    const name = speaker.toLowerCase();
    if (name === "alice" || name.includes("alice")) return this.alice;
    if (name === "john" || name.includes("john")) return this.john;
    // Default: alternate between alice and john based on first character
    return name.charCodeAt(0) % 2 === 0 ? this.alice : this.john;
  }

  /** Speak locally (from control panel). */
  async speak(speaker: Speaker, text: string): Promise<void> {
    const head = speaker === "alice" ? this.alice : this.john;
    if (head) {
      head.speakText(text);
    }
  }

  /** Send a text message to the llm-room service. */
  sendUserMessage(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "user_message", text }));
    }
  }

  /** Start recording user voice. Audio is sent to /api/stt on stop for fast transcription. */
  async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });

        // Stop mic tracks
        this.audioStream?.getTracks().forEach((track) => track.stop());
        this.audioStream = null;
        this.isRecording = false;

        // POST audio directly to ElevenLabs STT (scribe_v2) for fastest transcription
        try {
          const form = new FormData();
          form.append("file", blob, "audio.webm");
          form.append("model_id", "scribe_v2");
          form.append("language_code", "en");

          const res = await fetch(ELEVENLABS_STT_URL, {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: form,
          });

          if (!res.ok) {
            console.error("ElevenLabs STT failed:", res.status, await res.text());
            return;
          }

          const result = await res.json();
          const text = result.text?.trim();
          if (text) {
            // Show transcription in transcript
            this.onTranscript?.({
              speaker: "You",
              role: "user",
              message: text,
              timestamp: new Date(),
            });

            // Send transcribed text to llm-room via WS
            this.sendUserMessage(text);
          }
        } catch (err) {
          console.error("STT request failed:", err);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error("Failed to start recording:", err);
      this.isRecording = false;
    }
  }

  /** Stop recording user voice. Triggers STT transcription via HTTP. */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  /** Check if currently recording. */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  setMood(speaker: Speaker, mood: string) {
    const head = speaker === "alice" ? this.alice : this.john;
    if (head) {
      head.setMood(mood);
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  dispose() {
    this.stopRecording();
    this.ws?.close();
    this.ws = null;
    this.alice = null;
    this.john = null;
    this.initialized = false;
  }
}
