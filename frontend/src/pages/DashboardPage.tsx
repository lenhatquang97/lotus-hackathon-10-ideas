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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-12 py-16">
        {/* Welcome */}
        <div className="mb-14">
          <p className="meta mb-2" style={{ fontSize: '11px' }}>Welcome back</p>
          <h1 className="font-display text-[56px] italic" style={{ color: 'var(--color-ink)' }}>
            {user?.profile.display_name}
          </h1>
        </div>

        {/* Quick actions */}
        <div className={`grid gap-px mb-12 ${user?.role === 'creator' ? 'grid-cols-2' : 'grid-cols-1 max-w-sm'}`} style={{ backgroundColor: 'var(--color-fog)' }}>
          <Link to="/topics" className="block p-8 transition-all hover:bg-ink group" style={{ backgroundColor: 'var(--color-surface)' }}>
            <span className="meta block mb-4 group-hover:text-white/60" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>01</span>
            <h3 className="font-display text-[22px] font-semibold mb-2 group-hover:text-white" style={{ color: 'var(--color-ink)' }}>Explore Worlds</h3>
            <p className="font-body text-[13px] group-hover:text-white/70" style={{ color: 'var(--color-ash)' }}>Browse and join conversation practice scenarios</p>
          </Link>
          {user?.role === 'creator' && (
            <Link to="/studio" className="block p-8 transition-all hover:bg-ink group" style={{ backgroundColor: 'var(--color-surface)' }}>
              <span className="meta block mb-4 group-hover:text-white/60" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>02</span>
              <h3 className="font-display text-[22px] font-semibold mb-2 group-hover:text-white" style={{ color: 'var(--color-ink)' }}>Creator Studio</h3>
              <p className="font-body text-[13px] group-hover:text-white/70" style={{ color: 'var(--color-ash)' }}>Build and publish your own conversation worlds</p>
            </Link>
          )}
        </div>

        {/* Recent sessions */}
        <div>
          <h2 className="meta mb-6" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Recent Sessions</h2>
          {loading ? (
            <p className="meta" style={{ fontSize: '11px' }}>Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center border" style={{ borderColor: 'var(--color-fog)' }}>
              <p className="font-display text-xl italic mb-2" style={{ color: 'var(--color-ink)' }}>No sessions yet</p>
              <Link to="/topics" className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-ash)' }}>Start your first session</Link>
            </div>
          ) : (
            <div className="space-y-px" style={{ backgroundColor: 'var(--color-fog)' }}>
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <div>
                    <p className="font-body text-[14px] mb-1" style={{ color: 'var(--color-ink)' }}>
                      {s.status === 'completed' ? 'Completed session' : `Session (${s.status})`}
                    </p>
                    <p className="meta" style={{ fontSize: '10px' }}>
                      {s.duration_seconds > 0 ? `${Math.floor(s.duration_seconds / 60)}m ${s.duration_seconds % 60}s` : 'In progress'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.evaluation && (
                      <span className="font-display text-[24px]" style={{ color: 'var(--color-ink)' }}>
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
