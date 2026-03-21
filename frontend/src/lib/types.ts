export type Speaker = "alice" | "john";

export interface TranscriptEntry {
  speaker: string;
  message: string;
  timestamp: Date;
  type?: "agent" | "learner" | "engagement" | "phase" | "system";
}

export interface SpeakCommand {
  speaker: Speaker;
  message: string;
}

// WebSocket messages from server
export type ServerMessage =
  | { type: "session_started"; script_id: string; title: string; personas: string[] }
  | { type: "agent_turn"; speaker: string; speaker_name: string; text: string }
  | { type: "engagement"; speaker: string; speaker_name: string; text: string; awaiting_response: boolean }
  | { type: "phase_change"; phase: number; phase_name: string }
  | { type: "session_ended"; reason: string }
  | { type: "error"; message: string }
  | { type: "pong" };

// WebSocket messages from client
export type ClientMessage =
  | { action: "start"; script_id: string }
  | { action: "speak"; text: string }
  | { action: "end" }
  | { action: "ping" };
