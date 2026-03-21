import { useEffect, useRef } from 'react';
import type { TranscriptLine } from '../types/room.types';

interface TranscriptPanelProps {
  transcript: TranscriptLine[];
  isOpen: boolean;
  onToggle: () => void;
}

export function TranscriptPanel({ transcript, isOpen, onToggle }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className={`transcript-panel${isOpen ? '' : ' closed'}`}>
      <button className="transcript-toggle" onClick={onToggle}>
        {isOpen ? 'CLOSE' : 'LOG'}
      </button>
      <div className="transcript-header">Transcript</div>
      <div className="transcript-body">
        {transcript.length === 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#6B6B6B',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
          }}>
            Conversation will appear here...
          </span>
        )}
        {transcript.map(line => (
          <div key={line.id} className={`transcript-line${line.isUser ? ' user' : ''}`}>
            <span className="transcript-speaker">{line.speakerName}</span>
            <span className={`transcript-text${line.isUser ? ' user' : ''}${line.isStreaming ? ' streaming' : ''}`}>
              {line.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
