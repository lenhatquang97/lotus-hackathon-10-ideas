"use client";

import { useEffect, useRef } from "react";
import type { RoomManager } from "@/lib/room-manager";

interface ThreeCanvasProps {
  onReady: (room: RoomManager) => void;
  onError: (error: Error) => void;
}

export default function ThreeCanvas({ onReady, onError }: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<RoomManager | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        const { RoomManager } = await import("@/lib/room-manager");
        const room = new RoomManager(containerRef.current!);
        await room.init();
        roomRef.current = room;
        onReady(room);
      } catch (err) {
        console.error("Failed to initialize TalkingHead room:", err);
        onError(
          err instanceof Error ? err : new Error("Failed to initialize room")
        );
      }
    })();

    return () => {
      roomRef.current?.dispose();
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        minHeight: "400px",
        backgroundImage: "url('/cool_office.png')",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#0c0a14",
      }}
    />
  );
}
