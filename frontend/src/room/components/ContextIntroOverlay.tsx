import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_TEXT = "Get ready for the conversation. Listen carefully and respond naturally.";

const TYPE_SPEED = 25; // ms per character

interface ContextIntroOverlayProps {
  description?: string;
  worldName?: string;
  onBegin: () => void;
}

export function ContextIntroOverlay({ description, worldName, onBegin }: ContextIntroOverlayProps) {
  const text = description || DEFAULT_TEXT;
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayedText = text.slice(0, charIndex);

  // Type out characters
  useEffect(() => {
    if (!isTyping) return;
    if (charIndex >= text.length) {
      setIsTyping(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCharIndex(prev => prev + 1);
    }, TYPE_SPEED);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [charIndex, isTyping, text]);

  const handleBeginConversation = useCallback(() => {
    setExiting(true);
    setTimeout(onBegin, 400);
  }, [onBegin]);

  const handleAdvance = useCallback(() => {
    if (isTyping) {
      // Skip typing — show full text immediately
      if (timerRef.current) clearTimeout(timerRef.current);
      setCharIndex(text.length);
      setIsTyping(false);
    }
  }, [isTyping, text.length]);

  // Click or key to advance
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleAdvance]);

  return (
    <div
      className={`game-dialogue-overlay${exiting ? ' exiting' : ''}`}
      onClick={handleAdvance}
    >
      {/* Dim background */}
      <div className="game-dialogue-backdrop" />

      {/* Dialogue box at bottom */}
      <div className="game-dialogue-box">
        {/* Speaker name tag */}
        <div className="game-dialogue-speaker narrator">
          {worldName || 'BRIEFING'}
        </div>

        {/* Text area */}
        <div className="game-dialogue-text">
          {displayedText}
          {isTyping && <span className="game-dialogue-cursor">|</span>}
        </div>

        {/* Footer */}
        <div className="game-dialogue-footer">
          <span />
          {!isTyping ? (
            <button
              className="game-dialogue-start-btn"
              onClick={(e) => { e.stopPropagation(); handleBeginConversation(); }}
            >
              START CONVERSATION
            </button>
          ) : (
            <span className="game-dialogue-prompt">CLICK TO SKIP</span>
          )}
        </div>
      </div>
    </div>
  );
}
