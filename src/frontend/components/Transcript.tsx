"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/types";

interface TranscriptProps {
  entries: TranscriptEntry[];
}

const speakerStyles: Record<string, { color: string; glow: string }> = {
  Alice: { color: "var(--vibe-purple)", glow: "rgba(168, 85, 247, 0.3)" },
  John: { color: "var(--vibe-teal)", glow: "rgba(6, 182, 212, 0.3)" },
  You: { color: "var(--vibe-green)", glow: "rgba(34, 197, 94, 0.3)" },
  system: { color: "rgba(240, 238, 245, 0.4)", glow: "none" },
};

export default function Transcript({ entries }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries]);

  return (
    <div className="glass-card neon-border p-5 w-full max-w-3xl">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: "var(--vibe-teal)",
            boxShadow: "0 0 8px var(--vibe-teal)",
          }}
        />
        <h3
          className="text-sm font-semibold uppercase tracking-[0.2em]"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            background: "linear-gradient(90deg, var(--vibe-teal), var(--vibe-green))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Transcript
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="space-y-2.5 max-h-48 overflow-y-auto pr-2 vibe-scroll"
      >
        {entries.length === 0 ? (
          <p
            className="text-sm italic"
            style={{ color: "rgba(240, 238, 245, 0.35)" }}
          >
            Start the conversation to see the transcript.
          </p>
        ) : (
          entries.map((entry, i) => {
            // Phase change — render as a divider
            if (entry.type === "phase") {
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1"
                  style={{ color: "rgba(240, 238, 245, 0.3)" }}
                >
                  <div className="flex-1 h-px" style={{ background: "rgba(240, 238, 245, 0.1)" }} />
                  <span className="text-xs uppercase tracking-wider">{entry.message}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(240, 238, 245, 0.1)" }} />
                </div>
              );
            }

            // System message
            if (entry.type === "system") {
              return (
                <div
                  key={i}
                  className="text-xs italic text-center py-1"
                  style={{ color: "rgba(240, 238, 245, 0.35)" }}
                >
                  {entry.message}
                </div>
              );
            }

            const style = speakerStyles[entry.speaker] ?? speakerStyles.system;
            const isEngagement = entry.type === "engagement";

            return (
              <div key={i} className="flex gap-2.5 text-sm transcript-msg">
                <span
                  className="shrink-0 tabular-nums"
                  style={{ color: "rgba(240, 238, 245, 0.3)", fontSize: "0.75rem", paddingTop: "2px" }}
                >
                  {entry.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span
                  className="font-semibold shrink-0"
                  style={{
                    fontFamily: "'Fredoka', sans-serif",
                    color: style.color,
                    textShadow: `0 0 10px ${style.glow}`,
                  }}
                >
                  {entry.speaker}:
                </span>
                <span
                  style={{
                    color: isEngagement
                      ? "rgba(6, 182, 212, 0.9)"
                      : "rgba(240, 238, 245, 0.85)",
                    fontStyle: isEngagement ? "italic" : "normal",
                  }}
                >
                  {entry.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
