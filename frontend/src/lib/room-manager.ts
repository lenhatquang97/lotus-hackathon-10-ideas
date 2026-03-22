import {
    Scribe,
    RealtimeEvents,
    CommitStrategy,
    type RealtimeConnection,
} from "@elevenlabs/client";
import type { Speaker, TranscriptEntry } from "./types";

// TalkingHead is an ESM module, we import its type loosely
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TalkingHeadInstance = any;

// Use relative URL so Vite proxy handles routing to backend
const SCRIBE_TOKEN_URL = "/api/v1/rooms/scribe-token";

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
    private scribeConnection: RealtimeConnection | null = null;
    private isRecording = false;
    private hasPartialText = false;
    /** Callback for live partial transcript updates */
    onPartialTranscript: ((text: string) => void) | null = null;
    /** Callback when user starts speaking (first partial transcript arrives) — for barge-in */
    onUserSpeechStart: (() => void) | null = null;

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

        // Wait for scene to settle and first frames to render
        await new Promise((resolve) => setTimeout(resolve, 3500));

        // Wait for two animation frames to guarantee models are painted on screen
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve());
            });
        });

        onProgress?.("Ready!", 100);
        this.initialized = true;
    }

    /** Connect to the llm-room conversational AI service WebSocket. */
    connectWebSocket(
        onTranscript: (entry: TranscriptEntry) => void,
        topicId?: string,
    ) {
        this.onTranscript = onTranscript;

        // Connect to llm-room service via Vite proxy
        const path = topicId ? `/ws/room/${topicId}` : `/ws/room`;
        const wsProtocol =
            window.location.protocol === "https:" ? "wss:" : "ws:";
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

        this.onTranscript?.({
            speaker,
            role: "agent",
            message: text,
            timestamp: new Date(),
        });

        head.speakText(text);
        head.speakMarker(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(
                    JSON.stringify({ type: "speak_done", name: speaker }),
                );
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

    /** Fetch a single-use Scribe token from the backend (keeps API key server-side). */
    private async fetchScribeToken(): Promise<string> {
        const res = await fetch(SCRIBE_TOKEN_URL, { method: "POST" });
        if (!res.ok)
            throw new Error(`Failed to get scribe token: ${res.status}`);
        const data = await res.json();
        return data.token;
    }

    /**
     * Start realtime recording using ElevenLabs Scribe SDK.
     * Opens mic → streams audio via WebSocket → receives realtime transcripts.
     */
    async startRecording(): Promise<void> {
        if (this.isRecording) return;

        try {
            const token = await this.fetchScribeToken();

            // Use Scribe.connect with microphone mode — handles PCM conversion automatically.
            // CommitStrategy.VAD lets Scribe's built-in VAD auto-commit when silence is detected,
            // so transcripts are emitted automatically without manual commit().
            const connection = Scribe.connect({
                token,
                modelId: "scribe_v2_realtime",
                languageCode: "en",
                commitStrategy: CommitStrategy.VAD,
                microphone: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                },
            });

            this.scribeConnection = connection;

            connection.on(RealtimeEvents.OPEN, () => {
                console.log("[Scribe] Connected");
            });

            connection.on(RealtimeEvents.SESSION_STARTED, () => {
                console.log("[Scribe] Session started");
            });

            connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
                if (data.text) {
                    // First partial = user started speaking → barge-in
                    if (!this.hasPartialText) {
                        this.hasPartialText = true;
                        this.onUserSpeechStart?.();
                    }
                    this.onPartialTranscript?.(data.text);
                }
            });

            connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
                this.hasPartialText = false;
                const text = data.text?.trim();
                if (text && !(text.startsWith("[") && text.endsWith("]"))) {
                    this.onTranscript?.({
                        speaker: "You",
                        role: "user",
                        message: text,
                        timestamp: new Date(),
                    });
                    this.sendUserMessage(text);
                }
                this.onPartialTranscript?.("");
            });

            connection.on(RealtimeEvents.ERROR, (data) => {
                console.error("[Scribe] Error:", data);
            });

            connection.on(RealtimeEvents.CLOSE, () => {
                console.log("[Scribe] Connection closed");
                this.isRecording = false;
            });

            this.isRecording = true;
        } catch (err) {
            console.error("Failed to start recording:", err);
            this.cleanupRecording();
        }
    }

    /**
     * Stop recording. With VAD commit strategy, Scribe auto-commits on silence.
     * We just close the connection cleanly.
     */
    stopRecording() {
        if (!this.isRecording || !this.scribeConnection) return;
        this.cleanupRecording();
    }

    /** Tear down Scribe connection and mic. */
    private cleanupRecording() {
        this.isRecording = false;
        if (this.scribeConnection) {
            this.scribeConnection.close();
            this.scribeConnection = null;
        }
    }

    /** Check if currently recording. */
    getIsRecording(): boolean {
        return this.isRecording;
    }

    /** Stop all avatars from speaking (barge-in). */
    stopSpeaking() {
        if (this.alice) {
            try {
                this.alice.stopSpeaking();
            } catch {
                /* no-op */
            }
        }
        if (this.john) {
            try {
                this.john.stopSpeaking();
            } catch {
                /* no-op */
            }
        }
        // Notify backend about interruption
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "barge_in" }));
        }
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
        this.cleanupRecording();
        this.ws?.close();
        this.ws = null;
        this.alice = null;
        this.john = null;
        this.initialized = false;
    }
}
