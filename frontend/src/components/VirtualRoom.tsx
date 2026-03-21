"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import ControlPanel from "./ControlPanel";
import Transcript from "./Transcript";
import type { RoomManager } from "@/lib/room-manager";
import type { Speaker, TranscriptEntry, ServerMessage } from "@/lib/types";
import { ConversationClient, type ConnectionState } from "@/lib/ws-client";
import { RealtimeTranscriber, type TranscriberState } from "@/lib/realtime-transcriber";

const ThreeCanvas = dynamic(() => import("./ThreeCanvas"), { ssr: false });

export default function VirtualRoom() {
  const roomRef = useRef<RoomManager | null>(null);
  const clientRef = useRef<ConversationClient | null>(null);
  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [micState, setMicState] = useState<TranscriberState>("idle");
  const [partialTranscript, setPartialTranscript] = useState("");

  const addTranscript = useCallback(
    (speaker: string, message: string, type: TranscriptEntry["type"] = "agent") => {
      setTranscript((prev) => [
        ...prev,
        { speaker, message, timestamp: new Date(), type },
      ]);
    },
    []
  );

  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "session_started":
          setSessionActive(true);
          addTranscript("system", `Conversation started: ${msg.title}`, "system");
          break;

        case "agent_turn":
          // Drive the avatar to speak
          if (msg.speaker === "alice" || msg.speaker === "john") {
            roomRef.current?.speak(msg.speaker as Speaker, msg.text);
          }
          addTranscript(msg.speaker_name, msg.text, "agent");
          break;

        case "engagement":
          // Agent is asking the learner a question
          if (msg.speaker === "alice" || msg.speaker === "john") {
            roomRef.current?.speak(msg.speaker as Speaker, msg.text);
          }
          addTranscript(msg.speaker_name, msg.text, "engagement");
          if (msg.awaiting_response) {
            setAwaitingResponse(true);
          }
          break;

        case "phase_change":
          addTranscript("system", `Phase ${msg.phase}: ${msg.phase_name}`, "phase");
          break;

        case "session_ended":
          setSessionActive(false);
          setAwaitingResponse(false);
          addTranscript("system", "Conversation ended.", "system");
          break;

        case "error":
          addTranscript("system", `Error: ${msg.message}`, "system");
          break;
      }
    },
    [addTranscript]
  );

  // Initialize WebSocket client once
  useEffect(() => {
    const client = new ConversationClient();
    client.onMessage = handleServerMessage;
    client.onStateChange = setConnectionState;
    clientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [handleServerMessage]);

  // Initialize realtime transcriber
  useEffect(() => {
    const transcriber = new RealtimeTranscriber();
    transcriber.onStateChange = setMicState;
    transcriber.onPartial = (delta) => {
      setPartialTranscript((prev) => prev + delta);
    };
    transcriber.onSpeechStart = () => {
      setPartialTranscript("");
    };
    transcriberRef.current = transcriber;

    return () => {
      transcriber.stop();
    };
  }, []);

  // When transcription completes, send to backend + show in transcript
  useEffect(() => {
    const transcriber = transcriberRef.current;
    if (!transcriber) return;

    transcriber.onTranscript = (text: string) => {
      clientRef.current?.speak(text);
      addTranscript("You", text, "learner");
      setAwaitingResponse(false);
      setPartialTranscript("");
    };
  }, [addTranscript]);

  const handleMicToggle = useCallback(() => {
    const transcriber = transcriberRef.current;
    if (!transcriber) return;

    if (micState === "idle" || micState === "error") {
      transcriber.start();
    } else {
      transcriber.stop();
    }
  }, [micState]);

  const handleRoomReady = useCallback((room: RoomManager) => {
    roomRef.current = room;
    setLoading(false);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    setLoading(false);
  }, []);

  const handleStart = useCallback(() => {
    clientRef.current?.connect("salary_negotiation");
  }, []);

  const handleStop = useCallback(() => {
    clientRef.current?.disconnect();
    setSessionActive(false);
    setAwaitingResponse(false);
  }, []);

  const handleLearnerSpeak = useCallback(
    (text: string) => {
      clientRef.current?.speak(text);
      addTranscript("You", text, "learner");
      setAwaitingResponse(false);
    },
    [addTranscript]
  );

  const avatarsReady = !loading && !error;
  const canStart = avatarsReady && connectionState === "disconnected" && !sessionActive;
  const canSpeak = sessionActive && connectionState === "connected";

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#0c0a14" }}>
      {/* 3D Scene — fills entire viewport */}
      <div className="absolute inset-0">
        <ThreeCanvas onReady={handleRoomReady} onError={handleError} />
      </div>

      {/* Loading overlay */}
      {loading && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "rgba(12, 10, 20, 0.85)", backdropFilter: "blur(8px)" }}
        >
          <div className="text-center">
            <div
              className="inline-block w-12 h-12 rounded-full mb-5"
              style={{
                border: "3px solid rgba(168, 85, 247, 0.15)",
                borderTopColor: "var(--vibe-purple)",
                animation: "spin-glow 1s linear infinite",
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)",
              }}
            />
            <p
              className="text-sm font-medium"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                color: "rgba(240, 238, 245, 0.6)",
              }}
            >
              Loading avatars...
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "rgba(12, 10, 20, 0.85)", backdropFilter: "blur(8px)" }}
        >
          <div className="text-center max-w-md glass-card p-8">
            <p
              className="text-lg mb-2 font-semibold"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                color: "var(--vibe-orange)",
              }}
            >
              Failed to load virtual room
            </p>
            <p className="text-sm mb-5" style={{ color: "rgba(240, 238, 245, 0.4)" }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                background: "linear-gradient(135deg, var(--vibe-orange), var(--vibe-yellow))",
                color: "#0c0a14",
                boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Controls — overlaid at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-4 px-4 flex flex-col items-center gap-3">
        {/* Gradient fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(12, 10, 20, 0.9) 30%, transparent 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-3 w-full">
          <ControlPanel
            onSpeak={handleLearnerSpeak}
            onStart={handleStart}
            onStop={handleStop}
            canStart={canStart}
            sessionActive={sessionActive}
            awaitingResponse={awaitingResponse}
            disabled={!canSpeak}
            connectionState={connectionState}
            micState={micState}
            onMicToggle={handleMicToggle}
            partialTranscript={partialTranscript}
          />
          <Transcript entries={transcript} />
        </div>
      </div>
    </div>
  );
}
