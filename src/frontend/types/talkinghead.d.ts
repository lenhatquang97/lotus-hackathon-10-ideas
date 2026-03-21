declare module "@met4citizen/talkinghead" {
  export class TalkingHead {
    constructor(node: HTMLElement, opt?: Record<string, unknown>);

    // Scene and rendering
    scene: import("three").Scene;
    camera: import("three").PerspectiveCamera;
    armature: import("three").Object3D;
    renderer: import("three").WebGLRenderer | null;

    // Avatar
    avatar: Record<string, unknown>;
    isAvatarOnly: boolean;

    // Poses
    poseName: string;
    poseTemplates: Record<string, Record<string, unknown>>;
    setPoseFromTemplate(
      template: Record<string, unknown>,
      ms?: number
    ): void;

    // Eye contact
    speakTo: TalkingHead | import("three").Object3D | null;

    // Methods
    showAvatar(
      avatar: {
        url: string;
        body?: string;
        avatarMood?: string;
        ttsLang?: string;
        ttsVoice?: string;
        ttsRate?: number;
        ttsPitch?: number;
        ttsVolume?: number;
        lipsyncLang?: string;
        avatarIdleEyeContact?: number;
        avatarSpeakingEyeContact?: number;
        [key: string]: unknown;
      },
      onprogress?: ((url: string, event: ProgressEvent) => void) | null
    ): Promise<void>;

    speakText(
      text: string,
      opt?: Record<string, unknown> | null,
      onsubtitles?: ((node: HTMLElement) => void) | null,
      excludes?: number[][] | null
    ): void;

    animate(t: number): void;
    start(): void;
    stop(): void;

    setMood(mood: string): void;
    setView(view: string, opt?: Record<string, unknown>): void;

    playGesture(
      name: string,
      dur?: number,
      mirror?: boolean,
      ms?: number
    ): void;
  }
}
