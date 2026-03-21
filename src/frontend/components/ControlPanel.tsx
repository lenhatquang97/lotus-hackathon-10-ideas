"use client";

import { useState, type FormEvent } from "react";
import type { ConnectionState } from "@/lib/ws-client";
import type { TranscriberState } from "@/lib/realtime-transcriber";

interface ControlPanelProps {
  onSpeak: (message: string) => void;
  onStart: () => void;
  onStop: () => void;
  canStart: boolean;
  sessionActive: boolean;
  awaitingResponse: boolean;
  disabled?: boolean;
  connectionState: ConnectionState;
  micState: TranscriberState;
  onMicToggle: () => void;
  partialTranscript: string;
}

export default function ControlPanel({
  onSpeak,
  onStart,
  onStop,
  canStart,
  sessionActive,
  awaitingResponse,
  disabled = false,
  connectionState,
  micState,
  onMicToggle,
  partialTranscript,
}: ControlPanelProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || disabled) return;
    onSpeak(text);
    setMessage("");
  };

  const micIsActive = micState === "listening";
  const micIsConnecting = micState === "connecting";

  const statusText =
    connectionState === "connecting"
      ? "Connecting..."
      : micIsActive && partialTranscript
        ? partialTranscript
        : micIsActive
          ? "Listening... speak now"
          : awaitingResponse
            ? "They asked you a question — speak or type!"
            : sessionActive
              ? "Conversation in progress — jump in anytime"
              : "Ready to start";

  return (
    <div className="glass-card neon-border p-5 w-full max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: micIsActive
                ? "var(--vibe-green)"
                : sessionActive
                  ? "var(--vibe-teal)"
                  : "var(--vibe-purple)",
              boxShadow: `0 0 8px ${
                micIsActive
                  ? "var(--vibe-green)"
                  : sessionActive
                    ? "var(--vibe-teal)"
                    : "var(--vibe-purple)"
              }`,
              animation: micIsActive ? "pulse 1.5s ease-in-out infinite" : "none",
            }}
          />
          <h3
            className="text-sm font-semibold truncate"
            style={{
              fontFamily: "'Fredoka', sans-serif",
              background: micIsActive
                ? "linear-gradient(90deg, var(--vibe-green), var(--vibe-teal))"
                : "linear-gradient(90deg, var(--vibe-purple), var(--vibe-teal))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textTransform: micIsActive && partialTranscript ? "none" : "uppercase",
              letterSpacing: micIsActive && partialTranscript ? "0" : "0.15em",
            }}
          >
            {statusText}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canStart ? (
            <button
              onClick={onStart}
              className="rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                background: "linear-gradient(135deg, var(--vibe-purple), var(--vibe-teal))",
                color: "#fff",
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
            >
              Start Conversation
            </button>
          ) : sessionActive ? (
            <button
              onClick={onStop}
              className="rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                background: "rgba(240, 238, 245, 0.1)",
                border: "1px solid rgba(240, 238, 245, 0.2)",
                color: "rgba(240, 238, 245, 0.6)",
              }}
            >
              End
            </button>
          ) : null}
        </div>
      </div>

      {/* Learner input — only shown during active session */}
      {sessionActive && (
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          {/* Mic button */}
          <button
            type="button"
            onClick={onMicToggle}
            disabled={disabled || micIsConnecting}
            className="rounded-xl p-2.5 transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title={micIsActive ? "Stop microphone" : "Start microphone"}
            style={{
              background: micIsActive
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(34, 197, 94, 0.12)",
              border: `1px solid ${
                micIsActive
                  ? "rgba(239, 68, 68, 0.5)"
                  : "rgba(34, 197, 94, 0.3)"
              }`,
              boxShadow: micIsActive
                ? "0 0 12px rgba(239, 68, 68, 0.2)"
                : "none",
            }}
          >
            {micIsActive ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="5" width="10" height="10" rx="2" fill="rgb(239, 68, 68)" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="7" y="2" width="6" height="10" rx="3" stroke="rgb(34, 197, 94)" strokeWidth="1.5" />
                <path d="M4 9C4 12.3137 6.68629 15 10 15C13.3137 15 16 12.3137 16 9" stroke="rgb(34, 197, 94)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="15" x2="10" y2="18" stroke="rgb(34, 197, 94)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <div className="flex-1 flex flex-col gap-1.5">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                micIsActive
                  ? "Or type here..."
                  : awaitingResponse
                    ? "Type your answer..."
                    : "Jump into the conversation..."
              }
              disabled={disabled}
              autoFocus={awaitingResponse}
              className="rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none disabled:opacity-40"
              style={{
                background: "rgba(240, 238, 245, 0.06)",
                border: awaitingResponse
                  ? "1px solid rgba(6, 182, 212, 0.5)"
                  : "1px solid rgba(240, 238, 245, 0.1)",
                color: "var(--foreground)",
                boxShadow: awaitingResponse
                  ? "0 0 12px rgba(6, 182, 212, 0.15)"
                  : "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(168, 85, 247, 0.15)";
              }}
              onBlur={(e) => {
                if (!awaitingResponse) {
                  e.currentTarget.style.borderColor = "rgba(240, 238, 245, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            style={{
              fontFamily: "'Fredoka', sans-serif",
              background: "linear-gradient(135deg, var(--vibe-purple), var(--vibe-teal))",
              color: "#fff",
              boxShadow:
                disabled || !message.trim()
                  ? "none"
                  : "0 0 20px rgba(168, 85, 247, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
