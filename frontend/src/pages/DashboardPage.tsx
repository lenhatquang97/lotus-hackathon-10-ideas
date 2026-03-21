import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { sessionsApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import type { Session } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionsApi.history({ limit: 5 }).then(r => setSessions(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-12 py-16">
        {/* Welcome */}
        <div className="mb-14">
          <p className="meta mb-2" style={{ fontSize: '11px' }}>Welcome back</p>
          <h1 className="font-display text-[56px] italic" style={{ color: 'var(--color-text-primary)' }}>
            {user?.profile.display_name}
          </h1>
        </div>

        {/* Quick actions */}
        <div className="grid gap-px mb-12 grid-cols-1 max-w-sm" style={{ backgroundColor: 'var(--color-border)' }}>
          <Link to="/topics" className="block p-8 transition-all group" style={{ backgroundColor: 'var(--color-surface)' }}>
            <span className="meta block mb-4" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>01</span>
            <h3 className="font-display text-[22px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Explore Worlds</h3>
            <p className="font-body text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>Browse, create, and join conversation scenarios</p>
          </Link>
        </div>

        {/* Recent sessions */}
        <div>
          <h2 className="meta mb-6" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Recent Sessions</h2>
          {loading ? (
            <p className="meta" style={{ fontSize: '11px' }}>Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center border" style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-display text-xl italic mb-2" style={{ color: 'var(--color-text-primary)' }}>No sessions yet</p>
              <Link to="/topics" className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-text-secondary)' }}>Start your first session</Link>
            </div>
          ) : (
            <div className="space-y-px" style={{ backgroundColor: 'var(--color-border)' }}>
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <div>
                    <p className="font-body text-[14px] mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {s.status === 'completed' ? 'Completed session' : `Session (${s.status})`}
                    </p>
                    <p className="meta" style={{ fontSize: '10px' }}>
                      {s.duration_seconds > 0 ? `${Math.floor(s.duration_seconds / 60)}m ${s.duration_seconds % 60}s` : 'In progress'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.evaluation && (
                      <span className="font-display text-[24px]" style={{ color: 'var(--color-text-primary)' }}>
                        {Math.round(s.evaluation.composite_score * 100)}
                      </span>
                    )}
                    {s.status === 'completed' && (
                      <Link to={`/session/${s.id}/debrief`} className="meta hover:underline" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
