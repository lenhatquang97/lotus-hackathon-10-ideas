'use client';

import { useEffect, useRef } from 'react';

interface BriefingOverlayProps {
  worldName: string;
  scenarioContext: string;
  onClose: () => void;
}

export function BriefingOverlay({ worldName, scenarioContext, onClose }: BriefingOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <div className="briefing-overlay" ref={ref}>
      <div className="briefing-label">World Briefing</div>
      <div className="briefing-title">{worldName}</div>
      <div className="briefing-body">{scenarioContext}</div>
    </div>
  );
}
