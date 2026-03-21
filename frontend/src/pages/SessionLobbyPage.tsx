import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsApi, topicsApi } from '../services/api';
import { useSessionStore } from '../stores/sessionStore';
import type { Topic } from '../types';

export default function SessionLobbyPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [micOk, setMicOk] = useState(false);
  const [checkingMic, setCheckingMic] = useState(false);
  const store = useSessionStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) return;
    sessionsApi.get(sessionId).then(async res => {
      store.setSession(res.data);
      const t = await topicsApi.get(res.data.topic_id);
      setTopic(t.data);
      store.setTopic(t.data);
    });
  }, [sessionId]);

  const checkMic = async () => {
    setCheckingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicOk(true);
    } catch {
      alert('Please allow microphone access to continue.');
    } finally {
      setCheckingMic(false);
    }
  };

  if (!topic) return (
    <div className="min-h-screen flex items-center justify-center meta" style={{ backgroundColor: 'var(--color-bg)' }}>
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-[560px]">
        {/* Meta */}
        <div className="flex items-center gap-4 mb-5">
          {(topic.tags || []).map(t => (
            <span key={t} className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>{t.toUpperCase()}</span>
          ))}
          {(topic.difficulty_levels || []).map(l => (
            <span key={l} className="meta ml-auto px-2 py-0.5 border" style={{ fontSize: '10px', borderColor: 'var(--color-border)' }}>{l}</span>
          ))}
        </div>

        <h1 className="font-display text-[40px] font-semibold leading-[1.1] mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {topic.title}
        </h1>

        <div className="p-5 border mb-7" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {topic.description}
          </p>
        </div>

        {/* Agent list */}
        <div className="mb-7 space-y-px" style={{ backgroundColor: 'var(--color-border)' }}>
          {(topic.characters || []).map(char => (
            <div key={char.id} className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {char.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-body font-medium text-[15px]" style={{ color: 'var(--color-text-primary)' }}>{char.name}</p>
                <p className="meta" style={{ fontSize: '10px' }}>{char.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mic check */}
        {!micOk && (
          <button
            onClick={checkMic}
            disabled={checkingMic}
            className="w-full py-3 mb-3 font-body text-[13px] border transition-all disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {checkingMic ? 'Checking...' : 'Test Microphone'}
          </button>
        )}
        {micOk && (
          <p className="text-center meta mb-3" style={{ fontSize: '10px', color: '#4ade80' }}>Microphone ready</p>
        )}

        <button
          onClick={() => navigate(`/session/${sessionId}`)}
          disabled={!micOk}
          className="w-full py-4 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40 mb-2"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0D0B14' }}
        >
          Drop In
        </button>
        <p className="text-center meta" style={{ fontSize: '10px' }}>
          {micOk ? 'Ready to begin' : 'Test your microphone first'}
        </p>
      </div>
    </div>
  );
}
