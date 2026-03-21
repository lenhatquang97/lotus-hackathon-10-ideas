import { useRef, useState, useCallback, useEffect, lazy, Suspense } from "react";
import ControlPanel from "./ControlPanel";
import Transcript from "./Transcript";
// import { useVAD } from "../../hooks/useVAD";  // Silero VAD commented out — using Scribe built-in VAD
import type { RoomManager } from "../../lib/room-manager";
import type { Speaker, TranscriptEntry } from "../../lib/types";

const ThreeCanvas = lazy(() => import("./ThreeCanvas"));

interface VirtualRoomProps {
    topicId?: string;
}

export default function VirtualRoom({ topicId }: VirtualRoomProps) {
    const roomRef = useRef<RoomManager | null>(null);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStage, setLoadingStage] = useState("Initializing...");
    const [loadingPercent, setLoadingPercent] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [userSpeaking, setUserSpeaking] = useState(false);
    const [partialText, setPartialText] = useState("");

    // Silero VAD commented out — Scribe's built-in CommitStrategy.VAD handles
    // voice activity detection for auto-committing transcripts.
    // Barge-in is now triggered by the first partial transcript from Scribe.
    //
    // const [vadEnabled, setVadEnabled] = useState(true);
    // const vad = useVAD({
    //     onSpeechStart: () => {
    //         roomRef.current?.stopSpeaking();
    //         if (!roomRef.current?.getIsRecording()) {
    //             roomRef.current?.startRecording();
    //             setIsRecording(true);
    //         }
    //     },
    //     onSpeechEnd: () => {
    //         if (roomRef.current?.getIsRecording()) {
    //             roomRef.current?.stopRecording();
    //             setIsRecording(false);
    //         }
    //     },
    //     enabled: true,
    // });

    const addTranscript = useCallback((entry: TranscriptEntry) => {
        console.log({ entry });
        setTranscript((prev) => [...prev, entry]);
    }, []);

    const handleProgress = useCallback((stage: string, percent: number) => {
        setLoadingStage(stage);
        setLoadingPercent(percent);
    }, []);

    const handleRoomReady = useCallback(
        (room: RoomManager) => {
            roomRef.current = room;
            room.connectWebSocket(addTranscript, topicId);

            // Wire up partial transcript callback for realtime STT
            room.onPartialTranscript = (text: string) => {
                setPartialText(text);
                setUserSpeaking(!!text);
            };

            // Wire up barge-in: when Scribe detects first partial transcript,
            // stop avatars from speaking (user is interrupting)
            room.onUserSpeechStart = () => {
                room.stopSpeaking();
            };

            // Auto-start recording with Scribe (always-on mic with built-in VAD).
            // Scribe's CommitStrategy.VAD handles detecting speech vs silence.
            room.startRecording().then(() => {
                setIsRecording(true);
            });

            setLoading(false);
        },
        [addTranscript, topicId],
    );

    // Cleanup: stop recording on unmount
    useEffect(() => {
        return () => {
            roomRef.current?.stopRecording();
        };
    }, []);

    const handleError = useCallback((err: Error) => {
        setError(err.message);
        setLoading(false);
    }, []);

    const handleSpeak = useCallback((speaker: Speaker, message: string) => {
        roomRef.current?.speak(speaker, message);
        setTranscript((prev) => [
            ...prev,
            { speaker, role: "agent", message, timestamp: new Date() },
        ]);
    }, []);

    const handleSendMessage = useCallback((text: string) => {
        roomRef.current?.sendUserMessage(text);
        setTranscript((prev) => [
            ...prev,
            {
                speaker: "You",
                role: "user",
                message: text,
                timestamp: new Date(),
            },
        ]);
    }, []);

    const handleStartRecording = useCallback(() => {
        roomRef.current?.startRecording();
        setIsRecording(true);
    }, []);

    const handleStopRecording = useCallback(() => {
        roomRef.current?.stopRecording();
        setIsRecording(false);
    }, []);

    return (
        <div
            className="relative w-full h-screen overflow-hidden"
            style={{ background: "#0c0a14" }}
        >
            {/* 3D Scene */}
            <div className="absolute inset-0">
                <Suspense fallback={null}>
                    <ThreeCanvas
                        onReady={handleRoomReady}
                        onError={handleError}
                        onProgress={handleProgress}
                    />
                </Suspense>
            </div>

            {/* Loading modal */}
            {loading && !error && (
                <div
                    className="absolute inset-0 flex items-center justify-center z-20"
                    style={{
                        background: "rgba(12, 10, 20, 0.92)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <div
                        className="text-center p-8 rounded-2xl"
                        style={{
                            background: "rgba(30, 25, 50, 0.8)",
                            border: "1px solid rgba(168, 85, 247, 0.2)",
                            boxShadow:
                                "0 0 40px rgba(168, 85, 247, 0.1), 0 20px 60px rgba(0,0,0,0.4)",
                            minWidth: "320px",
                        }}
                    >
                        {/* Spinner */}
                        <div
                            className="inline-block w-14 h-14 rounded-full mb-6"
                            style={{
                                border: "3px solid rgba(168, 85, 247, 0.15)",
                                borderTopColor: "var(--vr-purple)",
                                animation: "vr-spin-glow 1s linear infinite",
                                boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)",
                            }}
                        />

                        {/* Title */}
                        <p
                            className="text-lg font-semibold mb-2"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                color: "rgba(240, 238, 245, 0.9)",
                            }}
                        >
                            Preparing Virtual Room
                        </p>

                        {/* Stage text */}
                        <p
                            className="text-sm mb-5"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                color: "rgba(240, 238, 245, 0.5)",
                            }}
                        >
                            {loadingStage}
                        </p>

                        {/* Progress bar */}
                        <div
                            className="mx-auto rounded-full overflow-hidden"
                            style={{
                                width: "80%",
                                height: "6px",
                                background: "rgba(168, 85, 247, 0.1)",
                            }}
                        >
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${loadingPercent}%`,
                                    background:
                                        "linear-gradient(90deg, var(--vr-purple), var(--vr-orange))",
                                    transition: "width 0.4s ease-out",
                                    boxShadow:
                                        "0 0 10px rgba(168, 85, 247, 0.4)",
                                }}
                            />
                        </div>

                        {/* Percent */}
                        <p
                            className="text-xs mt-2"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                color: "rgba(240, 238, 245, 0.3)",
                            }}
                        >
                            {loadingPercent}%
                        </p>
                    </div>
                </div>
            )}

            {/* Error overlay */}
            {error && (
                <div
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{
                        background: "rgba(12, 10, 20, 0.85)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <div className="text-center max-w-md vr-glass-card p-8">
                        <p
                            className="text-lg mb-2 font-semibold"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                color: "var(--vr-orange)",
                            }}
                        >
                            Failed to load virtual room
                        </p>
                        <p
                            className="text-sm mb-5"
                            style={{ color: "rgba(240, 238, 245, 0.4)" }}
                        >
                            {error}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                background:
                                    "linear-gradient(135deg, var(--vr-orange), var(--vr-yellow))",
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
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(12, 10, 20, 0.9) 30%, transparent 100%)",
                    }}
                />
                <div className="relative z-10 flex flex-col items-center gap-3 w-full">
                    {/* Recording status + barge-in indicator */}
                    <div className="flex items-center gap-3 mb-1">
                        <span
                            className="rounded-xl px-4 py-2 text-xs font-semibold"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                background: isRecording
                                    ? "linear-gradient(135deg, #10b981, #06b6d4)"
                                    : "rgba(240, 238, 245, 0.08)",
                                color: isRecording
                                    ? "#fff"
                                    : "rgba(240, 238, 245, 0.5)",
                                border: isRecording
                                    ? "none"
                                    : "1px solid rgba(240, 238, 245, 0.15)",
                                boxShadow: isRecording
                                    ? "0 0 16px rgba(16, 185, 129, 0.3)"
                                    : "none",
                            }}
                        >
                            {isRecording ? "🎙 Listening" : "Mic Off"}
                        </span>
                        {userSpeaking && (
                            <span
                                className="flex items-center gap-1.5 text-xs font-medium"
                                style={{
                                    fontFamily: "'Fredoka', sans-serif",
                                    color: "#ef4444",
                                }}
                            >
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Speaking...
                            </span>
                        )}
                    </div>

                    {/* Realtime partial transcript */}
                    {partialText && (
                        <div
                            className="w-full max-w-3xl px-4 py-2 rounded-xl text-sm italic"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                background: "rgba(240, 238, 245, 0.06)",
                                border: "1px solid rgba(168, 85, 247, 0.2)",
                                color: "rgba(240, 238, 245, 0.6)",
                            }}
                        >
                            {partialText}...
                        </div>
                    )}

                    <ControlPanel
                        onSpeak={handleSpeak}
                        onSendMessage={handleSendMessage}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        isRecording={isRecording}
                        disabled={loading || !!error}
                    />
                    <Transcript entries={transcript} />
                </div>
            </div>
        </div>
    );
}
