'use client';

import { useEffect, useState } from 'react';

interface ConversationHUDProps {
  agentName: string;
  agentRole: string;
  isConnected: boolean;
  isSpeaking: boolean;
  sessionStartTime: number | null;
}

export function ConversationHUD({ agentName, agentRole, isConnected, isSpeaking, sessionStartTime }: ConversationHUDProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
      {/* Agent info */}
      <div className="pointer-events-auto bg-black/70 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3">
        {isSpeaking && (
          <span className="flex gap-0.5 items-end h-3">
            {[1, 2, 3].map(i => (
              <span
                key={i}
                className="w-[2px] bg-white/70 animate-pulse"
                style={{
                  height: `${4 + Math.random() * 8}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </span>
        )}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          color: 'white',
        }}>
          {agentName}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.5)',
        }}>
          {agentRole}
        </span>
      </div>

      {/* Timer & Status */}
      <div className="pointer-events-auto bg-black/70 backdrop-blur-sm px-4 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 ${isConnected ? 'bg-white' : 'bg-white/30'}`} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.6)',
          }}>
            {isConnected ? 'Live' : 'Connecting'}
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'white',
        }}>
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
