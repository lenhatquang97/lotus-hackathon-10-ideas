import { useState, type FormEvent } from "react";
import type { Speaker } from "../../lib/types";

interface ControlPanelProps {
  onSpeak: (speaker: Speaker, message: string) => void;
  onSendMessage?: (text: string) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  disabled?: boolean;
}

export default function ControlPanel({
  onSpeak,
  onSendMessage,
  onStartRecording,
  onStopRecording,
  isRecording = false,
  disabled = false,
}: ControlPanelProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    // Send as user message to the conversational AI service
    if (onSendMessage) {
      onSendMessage(text);
    }
    setMessage("");
  };

  const handleMicToggle = () => {
    if (isRecording) {
      onStopRecording?.();
    } else {
      onStartRecording?.();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="vr-glass-card vr-neon-border p-5 w-full max-w-3xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: "var(--vr-purple)",
            boxShadow: "0 0 8px var(--vr-purple)",
          }}
        />
        <h3
          className="text-sm font-semibold uppercase tracking-[0.2em]"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            background: "linear-gradient(90deg, var(--vr-purple), var(--vr-teal))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Your Input
        </h3>
      </div>

      <div className="flex gap-3 items-end">
        {/* Mic button */}
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={disabled}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            background: isRecording
              ? "linear-gradient(135deg, #ef4444, #f97316)"
              : "rgba(168, 85, 247, 0.15)",
            color: isRecording ? "#fff" : "var(--vr-purple)",
            border: isRecording ? "none" : "1px solid rgba(168, 85, 247, 0.3)",
            boxShadow: isRecording
              ? "0 0 20px rgba(239, 68, 68, 0.4)"
              : "none",
          }}
        >
          {isRecording ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Stop
            </span>
          ) : (
            <span>🎤 Speak</span>
          )}
        </button>

        {/* Message input */}
        <div className="flex-1 flex flex-col gap-1.5">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Or type your message..."
            disabled={disabled}
            className="rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none disabled:opacity-40"
            style={{
              background: "rgba(240, 238, 245, 0.06)",
              border: "1px solid rgba(240, 238, 245, 0.1)",
              color: "#f0eef5",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(168, 85, 247, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(240, 238, 245, 0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            background: "linear-gradient(135deg, var(--vr-purple), var(--vr-teal))",
            color: "#fff",
            boxShadow: disabled || !message.trim()
              ? "none"
              : "0 0 20px rgba(168, 85, 247, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          Send
        </button>
      </div>
    </form>
  );
}
