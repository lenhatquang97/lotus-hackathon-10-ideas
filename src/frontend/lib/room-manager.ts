import type { Speaker } from "./types";

// TalkingHead is an ESM module, we import its type loosely
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TalkingHeadInstance = any;

interface QueueItem {
  speaker: Speaker;
  text: string;
}

export class RoomManager {
  private alice: TalkingHeadInstance = null;
  private john: TalkingHeadInstance = null;
  private container: HTMLDivElement;
  private initialized = false;

  // Speech queue — ensures avatars take turns, never overlap
  private speechQueue: QueueItem[] = [];
  private processingQueue = false;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  async init() {
    if (this.initialized) return;

    // Dynamic import of TalkingHead (ESM module)
    const { TalkingHead } = await import("@met4citizen/talkinghead");

    // Alice: standalone instance — owns the scene, renderer, camera
    this.alice = new TalkingHead(this.container, {
      ttsEndpoint: "/api/tts",
      lipsyncModules: ["en"],
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
      // Drive John's animation inside Alice's render loop
      update: (dt: number) => {
        this.john?.animate(dt);
      },
    });

    // Ensure transparent background so room image shows through
    this.alice.scene.background = null;

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

    // John: avatarOnly instance — no own scene/renderer, joins Alice's scene
    this.john = new TalkingHead(this.container, {
      ttsEndpoint: "/api/tts",
      lipsyncModules: ["en"],
      avatarOnly: true,
      avatarOnlyCamera: this.alice.camera,
    });

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

    // Position avatars

    if (this.alice.armature) {
      this.alice.armature.position.set(-0.5, 0.4, 0);
      this.alice.armature.rotation.set(0, 0.3, 0); // Facing slightly right
    }

    this.john.armature.position.set(0.4, 0.30, 0);
    this.john.armature.rotation.set(0, -0.3, 0); // Facing slightly left

    // Add John's armature to Alice's scene
    this.alice.scene.add(this.john.armature);

    // Wire up eye contact: each looks at the other when speaking
    this.alice.speakTo = this.john;
    this.john.speakTo = this.alice;

    // Use 'mid' body view — shows waist up + seated legs for podcast framing
    this.alice.setView("mid", {
      cameraDistance: 0,
      cameraX: 0,
      cameraY: -0.5,
    });

    // Brief delay for avatar setup
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.initialized = true;
  }

  /**
   * Queue a speak command. Avatars speak one at a time in order,
   * each waiting for the previous to finish before starting.
   */
  async speak(speaker: Speaker, text: string): Promise<void> {
    this.speechQueue.push({ speaker, text });
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;
    this.processingQueue = true;

    while (this.speechQueue.length > 0) {
      const { speaker, text } = this.speechQueue.shift()!;
      const head = speaker === "alice" ? this.alice : this.john;
      if (!head) continue;

      head.speakText(text);
      await this.waitUntilDone(head);
    }

    this.processingQueue = false;
  }

  /**
   * Wait for a TalkingHead instance to finish speaking.
   * Polls head.isSpeaking: waits for it to become true (TTS loaded & playing),
   * then waits for it to become false (audio finished).
   */
  private waitUntilDone(head: TalkingHeadInstance): Promise<void> {
    return new Promise((resolve) => {
      const POLL = 200;
      const START_TIMEOUT = 10000; // max 10s waiting for TTS to start
      const MAX_TOTAL = 60000;     // 60s absolute max per utterance
      let elapsed = 0;
      let sawSpeaking = false;

      const check = () => {
        elapsed += POLL;

        if (head.isSpeaking) {
          sawSpeaking = true;
        } else if (sawSpeaking) {
          // Was speaking, now done
          resolve();
          return;
        } else if (elapsed >= START_TIMEOUT) {
          // TTS never started — skip
          resolve();
          return;
        }

        if (elapsed >= MAX_TOTAL) {
          resolve();
          return;
        }

        setTimeout(check, POLL);
      };

      setTimeout(check, POLL);
    });
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
    this.speechQueue.length = 0;
    this.processingQueue = false;
    this.alice = null;
    this.john = null;
    this.initialized = false;
  }
}
