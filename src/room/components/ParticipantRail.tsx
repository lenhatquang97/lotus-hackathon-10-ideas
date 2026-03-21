'use client';

import type { Agent, RoomStateEnum } from '../types/room.types';

interface ParticipantRailProps {
  agents: Agent[];
  floorOwnerId: string | null;
  isMicActive: boolean;
  micMuted: boolean;
  roomState: RoomStateEnum;
  silenceSeconds: number;
  onMicToggle: () => void;
  onEndSession: () => void;
  onBriefingToggle?: () => void;
}

export function ParticipantRail({
  agents,
  floorOwnerId,
  isMicActive,
  micMuted,
  roomState,
  silenceSeconds,
  onMicToggle,
  onEndSession,
  onBriefingToggle,
}: ParticipantRailProps) {
  const isDisabled = roomState === 'CONNECTING' || roomState === 'ENDING';

  // Mic button: large, centered, clear state
  const micBtnClass = [
    'mic-btn',
    isMicActive ? 'mic-btn--active' : '',
    micMuted ? 'mic-btn--muted' : '',
  ].filter(Boolean).join(' ');

  // Label for mic state
  const micLabel = micMuted ? 'MUTED' : isMicActive ? 'LISTENING' : 'MIC ON';

  return (
    <div className={`participant-rail${isDisabled ? ' disabled' : ''}`}>
      {/* Participant chips — left */}
      <div className="participant-chips">
        {agents.map(agent => (
          <div
            key={agent.id}
            className={`participant-chip${floorOwnerId === agent.id ? ' speaking' : ''}`}
          >
            <div className="chip-avatar" />
            <span className="chip-name">{agent.name.split(' ')[0]}</span>
            <span className="chip-role">{agent.role}</span>
          </div>
        ))}
        {/* User chip */}
        <div className={`participant-chip${floorOwnerId === 'user' ? ' speaking' : ''}`}>
          <div className="chip-avatar" />
          <span className="chip-name">You</span>
        </div>
      </div>

      <div className="rail-divider" />

      {/* Center: mic button group */}
      <div className="mic-group">
        {roomState === 'SILENCE' && silenceSeconds > 0 && (
          <div className="silence-timer">{silenceSeconds}s</div>
        )}
        <button
          className={micBtnClass}
          onClick={onMicToggle}
          disabled={isDisabled}
          title={micMuted ? 'Click to unmute' : 'Click to mute'}
        >
          {/* Mic icon — changes based on muted state */}
          {micMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" x2="22" y1="2" y2="22" />
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
              <path d="M5 10v2a7 7 0 0 0 12 5" />
              <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
        <span className="mic-label">{micLabel}</span>
      </div>

      <div className="rail-divider" />

      {/* Right controls */}
      <div className={`rail-controls${isDisabled ? ' disabled' : ''}`}>
        {/* Briefing button */}
        <button
          className="rail-btn"
          onClick={onBriefingToggle}
          disabled={isDisabled}
          title="World Briefing"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
        </button>

        <div className="rail-divider" />

        {/* End session */}
        <button className="end-session-btn" onClick={onEndSession} disabled={isDisabled}>
          End Session
        </button>
      </div>
    </div>
  );
}
