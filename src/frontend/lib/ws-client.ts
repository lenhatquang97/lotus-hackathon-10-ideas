import type { ServerMessage, ClientMessage } from "./types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/session";

export type ConnectionState = "disconnected" | "connecting" | "connected";

export class ConversationClient {
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  onMessage: ((msg: ServerMessage) => void) | null = null;
  onStateChange: ((state: ConnectionState) => void) | null = null;

  connect(scriptId: string) {
    if (this.ws) this.disconnect();

    this.onStateChange?.("connecting");
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.onStateChange?.("connected");
      this.send({ action: "start", script_id: scriptId });

      // Heartbeat every 30s
      this.pingInterval = setInterval(() => {
        this.send({ action: "ping" });
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        if (msg.type === "pong") return;
        this.onMessage?.(msg);
      } catch {
        console.error("Failed to parse WebSocket message:", event.data);
      }
    };

    this.ws.onclose = () => {
      this.cleanup();
      this.onStateChange?.("disconnected");
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  speak(text: string) {
    this.send({ action: "speak", text });
  }

  end() {
    this.send({ action: "end" });
  }

  disconnect() {
    this.end();
    this.ws?.close();
    this.cleanup();
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.ws = null;
  }
}
