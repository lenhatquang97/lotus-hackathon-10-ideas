import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../stores/sessionStore';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { sessionsApi, topicsApi } from '../services/api';
import { Scene3D } from '../components/scene/Scene3D';
import type { TranscriptTurn } from '../types';

function ConversationHUD({ agentName, agentRole, isConnected, isSpeaking, sessionStartTime }: {
  agentName: string; agentRole: string; isConnected: boolean; isSpeaking: boolean; sessionStartTime: number | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
      <div className="pointer-events-auto px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        {isSpeaking && (
          <span className="flex gap-0.5 items-end" style={{ height: '12px' }}>
            {[1, 2, 3].map(i => (
              <span key={i} className="animate-pulse" style={{ width: '2px', height: `${4 + i * 3}px`, backgroundColor: 'rgba(255,255,255,0.7)', display: 'block', animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        )}
        <span className="font-display text-[14px] text-white">{agentName}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>{agentRole}</span>
      </div>
      <div className="pointer-events-auto px-4 py-2.5 flex items-center gap-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="flex items-center gap-1.5">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isConnected ? 'white' : 'rgba(255,255,255,0.3)', display: 'block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)' }}>{isConnected ? 'Live' : 'Connecting'}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'white' }}>
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

function TranscriptPanel({ transcript }: { transcript: TranscriptTurn[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);

  if (transcript.length === 0) return (
    <div className="h-full flex items-center justify-center">
      <p className="meta" style={{ fontSize: '11px' }}>Conversation will appear here...</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-3">
        {transcript.map(entry => (
          <div key={entry.turn_id} className={`flex flex-col ${entry.speaker === 'learner' ? 'items-end' : 'items-start'}`}>
            <span className="meta mb-1" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
              {entry.speaker === 'learner' ? 'YOU' : (entry.character_name?.toUpperCase() || 'AGENT')}
            </span>
            <div className="max-w-[85%] px-3 py-2 font-body text-[13px] leading-relaxed"
              style={{ backgroundColor: entry.speaker === 'learner' ? 'var(--color-accent)' : 'var(--color-bg)', color: entry.speaker === 'learner' ? '#0D0B14' : 'var(--color-text-primary)' }}>
              {entry.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function ScoreArc({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 56, height: 56 }}>
        <svg viewBox="0 0 56 56" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - value)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-ui text-[11px] font-medium" style={{ color }}>{pct}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
    </div>
  );
}

export default function ActiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = useSessionStore();
  const { startSession, endSession, toggleMic } = useSessionSocket(sessionId!);
  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    sessionsApi.get(sessionId).then(res => {
      store.setSession(res.data);
      return topicsApi.get(res.data.topic_id);
    }).then(res => store.setTopic(res.data));
  }, [sessionId]);

  useEffect(() => {
    const timer = setTimeout(() => startSession(), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (store.activeSpeaker && (store.topic as any)?.characters) {
      const idx = (store.topic as any).characters.findIndex((c: any) => c.id === store.activeSpeaker?.character_id);
      if (idx >= 0) setActiveCharIdx(idx);
    }
  }, [store.activeSpeaker]);

  const handleEnd = async () => {
    setEnding(true);
    endSession();
    try { await sessionsApi.end(sessionId!); } catch {}
    setTimeout(() => navigate(`/session/${sessionId}/debrief`), 1200);
  };

  const characters = (store.topic as any)?.characters || [];
  const activeChar = characters[activeCharIdx];

  if (ending) return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
      <p className="font-display italic text-white text-lg">Analysing your conversation...</p>
      <p className="meta mt-2" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Your coach is reviewing your performance</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* 3D Scene */}
      <div className="flex-1 relative">
        <Scene3D
          environment="office"
          characters={characters}
          activeCharacterId={store.activeSpeaker?.character_id || characters[activeCharIdx]?.id}
          isSpeaking={!!store.activeSpeaker}
        />

        {/* HUD overlay */}
        <ConversationHUD
          agentName={activeChar?.name || 'Agent'}
          agentRole={activeChar?.role || ''}
          isConnected={store.isSessionActive}
          isSpeaking={!!store.activeSpeaker}
          sessionStartTime={sessionStartTime}
        />

        {/* Live scores */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-5 py-3 flex items-center gap-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <ScoreArc label="Tone" value={store.liveScores.tone} color="#a78bfa" />
          <ScoreArc label="Content" value={store.liveScores.content} color="#34d399" />
          <ScoreArc label="Voice" value={store.liveScores.first_voice} color="#60a5fa" />
        </div>

        {/* Agent switcher */}
        {characters.length > 1 && (
          <div className="absolute bottom-4 left-4 z-10 flex gap-px">
            {characters.map((char: any, i: number) => (
              <button key={char.id} onClick={() => setActiveCharIdx(i)}
                className="px-3 py-1.5 font-ui text-[11px] uppercase transition-all"
                style={{ backgroundColor: activeCharIdx === i ? 'white' : 'rgba(0,0,0,0.6)', color: activeCharIdx === i ? 'black' : 'white', backdropFilter: 'blur(4px)' }}>
                {char.name}
              </button>
            ))}
          </div>
        )}

        {/* End button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button onClick={handleEnd}
            className="px-4 py-2 font-body text-[13px] transition-opacity"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--color-text-primary)', backdropFilter: 'blur(4px)' }}>
            End Session
          </button>
        </div>

        {/* Silence overlay */}
        {store.showSilenceOverlay && (
          <div className="absolute inset-0 flex items-center justify-center z-20" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="text-center p-10" style={{ backgroundColor: 'var(--color-bg)' }}>
              <p className="font-display text-[28px] italic mb-2" style={{ color: 'var(--color-text-primary)' }}>Your turn to speak</p>
              <p className="meta" style={{ fontSize: '11px' }}>Press the mic button and share your thoughts</p>
            </div>
          </div>
        )}
      </div>

      {/* Transcript panel */}
      <div style={{ height: '192px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="h-full flex">
          <div className="flex-1 overflow-hidden">
            <TranscriptPanel transcript={store.transcript} />
          </div>
          {/* Mic control */}
          <div className="flex flex-col items-center justify-center px-6 gap-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={toggleMic}
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all"
              style={{
                backgroundColor: store.isMicActive ? 'white' : 'rgba(255,255,255,0.1)',
                color: store.isMicActive ? 'black' : 'white',
                boxShadow: store.isMicActive ? '0 0 0 4px rgba(255,255,255,0.2)' : 'none',
              }}>
              {store.isMicActive ? '🎙️' : '🎤'}
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: store.isMicActive ? 'white' : 'rgba(255,255,255,0.3)' }}>
              {store.isMicActive ? 'Recording' : 'Tap to speak'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
