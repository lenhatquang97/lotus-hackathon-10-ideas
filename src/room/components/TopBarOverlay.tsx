'use client';

interface TopBarOverlayProps {
  worldName: string;
  isConnecting: boolean;
  sessionElapsed: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TopBarOverlay({ worldName, isConnecting, sessionElapsed }: TopBarOverlayProps) {
  return (
    <div className="top-bar">
      <span className="world-name">{worldName}</span>
      <div className="status-chip">
        <span className={`status-dot${isConnecting ? ' connecting' : ''}`} />
        <span>{isConnecting ? 'CONNECTING' : `LIVE ${formatTime(sessionElapsed)}`}</span>
      </div>
    </div>
  );
}
