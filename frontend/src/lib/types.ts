export type Speaker = "alice" | "john";

export type SpeakerRole = "agent" | "user" | "system";

export interface TranscriptEntry {
  speaker: string;
  role: SpeakerRole;
  message: string;
  timestamp: Date;
}

export interface SpeakCommand {
  speaker: Speaker;
  message: string;
}
