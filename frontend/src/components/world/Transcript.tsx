import { useEffect, useRef } from "react";
import type { TranscriptEntry, SpeakerRole } from "../../lib/types";

interface TranscriptProps {
  entries: TranscriptEntry[];
}

const roleStyles: Record<SpeakerRole, { bg: string; border: string; nameBg: string; nameColor: string; textColor: string }> = {
  agent: {
    bg: "rgba(168, 85, 247, 0.06)",
    border: "rgba(168, 85, 247, 0.15)",
    nameBg: "rgba(168, 85, 247, 0.15)",
    nameColor: "var(--vr-purple)",
    textColor: "rgba(240, 238, 245, 0.85)",
  },
  user: {
    bg: "rgba(249, 115, 22, 0.06)",
    border: "rgba(249, 115, 22, 0.15)",
    nameBg: "rgba(249, 115, 22, 0.15)",
    nameColor: "var(--vr-orange)",
    textColor: "rgba(240, 238, 245, 0.85)",
  },
  system: {
    bg: "rgba(240, 238, 245, 0.03)",
    border: "rgba(240, 238, 245, 0.08)",
    nameBg: "rgba(240, 238, 245, 0.08)",
    nameColor: "rgba(240, 238, 245, 0.4)",
    textColor: "rgba(240, 238, 245, 0.4)",
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Transcript({ entries }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries]);

  return (
    <div className="vr-glass-card vr-neon-border p-5 w-full max-w-3xl">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: "var(--vr-teal)",
            boxShadow: "0 0 8px var(--vr-teal)",
          }}
        />
        <h3
          className="text-sm font-semibold uppercase tracking-[0.2em]"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            background: "linear-gradient(90deg, var(--vr-teal), var(--vr-green))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Transcript
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="space-y-2 max-h-48 overflow-y-auto pr-2 vr-scroll"
      >
        {entries.length === 0 ? (
          <p
            className="text-sm italic"
            style={{ color: "rgba(240, 238, 245, 0.35)" }}
          >
            No messages yet. Use the control panel to make an avatar speak.
          </p>
        ) : (
          entries.map((entry, i) => {
            const style = roleStyles[entry.role] ?? roleStyles.agent;
            const isUser = entry.role === "user";
            const isSystem = entry.role === "system";

            if (isSystem) {
              return (
                <div
                  key={i}
                  className="text-center text-xs py-1 italic"
                  style={{ color: style.textColor }}
                >
                  {entry.message}
                </div>
              );
            }

            return (
              <div
                key={i}
                className="flex gap-2.5 text-sm rounded-lg px-3 py-2"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  flexDirection: isUser ? "row-reverse" : "row",
                  textAlign: isUser ? "right" : "left",
                }}
              >
                <div className="flex flex-col gap-0.5 shrink-0">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      background: style.nameBg,
                      color: style.nameColor,
                    }}
                  >
                    {isUser ? "You" : capitalize(entry.speaker)}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: "rgba(240, 238, 245, 0.25)", fontSize: "0.65rem" }}
                  >
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <span className="flex-1" style={{ color: style.textColor }}>
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
