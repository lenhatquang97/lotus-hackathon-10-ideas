import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { topicsApi, sessionsApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import type { Topic } from '../types';

export default function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (topicId) topicsApi.get(topicId).then(r => setTopic(r.data)).finally(() => setLoading(false));
  }, [topicId]);

  const handleStart = async () => {
    if (!topic) return;
    setJoining(true);
    try {
      const res = await sessionsApi.create(topic.id);
      navigate(`/session/${res.data.id}/lobby`);
    } catch {
      setJoining(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 meta">Loading...</div>
    </div>
  );

  if (!topic) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 meta">World not found</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="max-w-[800px] mx-auto px-12 py-16">
        {/* Meta */}
        <div className="flex items-center gap-4 mb-6">
          {topic.tags.map(t => (
            <span key={t} className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>{t.toUpperCase()}</span>
          ))}
          <span className="meta" style={{ fontSize: '10px' }}>·</span>
          {topic.cefr_levels.map(l => (
            <span key={l} className="meta px-2 py-0.5 border" style={{ fontSize: '10px', borderColor: 'var(--color-fog)' }}>{l}</span>
          ))}
        </div>

        <h1 className="font-display text-[48px] font-semibold leading-[1.1] mb-6" style={{ color: 'var(--color-ink)' }}>
          {topic.title}
        </h1>

        <p className="font-body text-[15px] leading-relaxed mb-10" style={{ color: 'var(--color-ash)' }}>
          {topic.description}
        </p>

        {/* Scenario context */}
        <div className="p-6 border mb-10" style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)' }}>
          <span className="meta block mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Scenario Context</span>
          <p className="font-body text-[14px] leading-relaxed" style={{ color: 'var(--color-ink)' }}>
            {topic.domain_knowledge}
          </p>
        </div>

        {/* Characters */}
        <div className="mb-10">
          <span className="meta block mb-5" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
            {topic.characters.length} {topic.characters.length === 1 ? 'Character' : 'Characters'}
          </span>
          <div className="space-y-px" style={{ backgroundColor: 'var(--color-fog)' }}>
            {topic.characters.map(char => (
              <div key={char.id} className="flex gap-4 p-5" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-fog)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ash)' }}
                >
                  {char.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-body font-medium text-[16px]" style={{ color: 'var(--color-ink)' }}>{char.name}</span>
                    <span className="meta" style={{ fontSize: '10px' }}>{char.role}</span>
                  </div>
                  <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>{char.persona}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={joining}
          className="w-full py-4 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40 mb-3"
          style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
        >
          {joining ? 'Entering...' : 'Drop In'}
        </button>
        <p className="text-center meta" style={{ fontSize: '10px' }}>Microphone required</p>

        <div className="mt-6 text-center">
          <Link to="/topics" className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-ash)' }}>
            Back to worlds
          </Link>
        </div>
      </div>
    </div>
  );
}
