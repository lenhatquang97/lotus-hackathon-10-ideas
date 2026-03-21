import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { topicsApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import type { Topic } from '../types';

export default function StudioDashboardPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => topicsApi.myTopics().then(r => setTopics(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handlePublish = async (id: string) => {
    await topicsApi.publish(id);
    load();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-12 py-16">
        <div className="flex items-baseline justify-between mb-12">
          <div>
            <p className="meta mb-2" style={{ fontSize: '11px' }}>Creator Studio</p>
            <h1 className="font-display text-[48px] italic" style={{ color: 'var(--color-ink)' }}>Your Worlds</h1>
          </div>
          <Link to="/studio/topics/create"
            className="font-body text-[13px] px-5 py-2 border transition-all hover:bg-ink hover:text-white hover:border-ink"
            style={{ borderColor: 'var(--color-ink)', color: 'var(--color-ink)' }}>
            + New World
          </Link>
        </div>

        {loading ? (
          <p className="meta" style={{ fontSize: '11px' }}>Loading...</p>
        ) : topics.length === 0 ? (
          <div className="py-16 text-center border" style={{ borderColor: 'var(--color-fog)' }}>
            <p className="font-display text-xl italic mb-4" style={{ color: 'var(--color-ink)' }}>No worlds yet</p>
            <Link to="/studio/topics/create" className="font-body text-[13px] uppercase tracking-[0.1em] px-8 py-3"
              style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}>
              Create Your First World
            </Link>
          </div>
        ) : (
          <div className="space-y-px" style={{ backgroundColor: 'var(--color-fog)' }}>
            {topics.map(t => (
              <div key={t.id} className="flex items-center gap-6 px-5 py-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-body font-medium text-[15px] truncate" style={{ color: 'var(--color-ink)' }}>{t.title}</h3>
                    <span className="meta px-1.5 py-0.5 border flex-shrink-0"
                      style={{ fontSize: '9px', letterSpacing: '0.1em', borderColor: t.status === 'published' ? 'var(--color-ink)' : 'var(--color-fog)', color: t.status === 'published' ? 'var(--color-ink)' : 'var(--color-ash)' }}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="meta" style={{ fontSize: '10px' }}>{t.characters.length} characters</span>
                    <span className="meta" style={{ fontSize: '10px' }}>·</span>
                    <span className="meta" style={{ fontSize: '10px' }}>{t.play_count} plays</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => navigate(`/studio/topics/${t.id}/edit`)} className="meta hover:underline" style={{ fontSize: '10px' }}>Edit</button>
                  {t.status === 'draft' && (
                    <button onClick={() => handlePublish(t.id)} className="meta hover:underline" style={{ fontSize: '10px', color: 'var(--color-ink)' }}>
                      Publish →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
