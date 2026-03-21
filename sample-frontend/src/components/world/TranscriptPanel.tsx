'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '@/lib/types';

export function TranscriptPanel({ transcript }: { transcript: TranscriptEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="meta" style={{ fontSize: '11px' }}>Conversation will appear here...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-3">
        {transcript.map((entry) => (
          <div
            key={entry.id}
            className={`flex flex-col ${entry.speaker === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="meta mb-1" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
              {entry.speaker === 'user' ? 'YOU' : entry.agentName?.toUpperCase() || 'AGENT'}
            </span>
            <div
              className="max-w-[85%] px-3 py-2 font-body text-[13px] leading-relaxed"
              style={{
                backgroundColor: entry.speaker === 'user' ? 'var(--color-ink)' : 'var(--color-paper)',
                color: entry.speaker === 'user' ? 'white' : 'var(--color-ink)',
              }}
            >
              {entry.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
