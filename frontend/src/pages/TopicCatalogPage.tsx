import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { topicsApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import type { Topic } from '../types';

const DOMAIN_FILTERS = ['All', 'business', 'negotiation', 'healthcare', 'career', 'travel', 'environment'];
const CEFR_FILTERS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="meta relative px-3 py-1.5 transition-colors duration-150 cursor-pointer"
      style={{ color: active ? 'var(--color-ink)' : 'var(--color-ash)', background: 'transparent', border: 'none' }}
    >
      {children}
      <span
        className="absolute bottom-0 left-3 right-3"
        style={{ height: '1.5px', backgroundColor: 'var(--color-ink)', display: 'block', transform: active ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 180ms' }}
      />
    </button>
  );
}

function TopicCard({ topic, onJoin }: { topic: Topic; onJoin: () => void }) {
  return (
    <div
      className="h-full px-6 py-7 transition-all duration-200 cursor-pointer group hover:bg-ink hover:text-white"
      style={{ backgroundColor: 'var(--color-surface)' }}
      onClick={onJoin}
    >
      <div className="flex items-baseline justify-between">
        <span className="meta group-hover:text-white/70" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
          {topic.tags[0] || 'General'}
        </span>
        <span className="meta group-hover:text-white/70" style={{ fontSize: '10px' }}>
          {topic.characters.length} {topic.characters.length === 1 ? 'CHARACTER' : 'CHARACTERS'}
        </span>
      </div>

      <div className="my-3.5 h-px transition-colors group-hover:bg-white/15" style={{ backgroundColor: 'var(--color-fog)' }} />

      <h3 className="font-display text-[22px] font-semibold leading-[1.2] mb-2.5 transition-colors group-hover:text-white" style={{ color: 'var(--color-ink)' }}>
        {topic.title}
      </h3>

      <p className="font-body text-[13px] leading-relaxed mb-5 line-clamp-3 transition-colors group-hover:text-white/80" style={{ color: 'var(--color-ash)' }}>
        {topic.description}
      </p>

      <div className="flex items-center">
        <span className="meta transition-colors group-hover:text-white/60" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
          {topic.play_count} plays
        </span>
        {topic.cefr_levels.map(l => (
          <span key={l} className="meta ml-auto px-2 py-0.5 border transition-colors group-hover:text-white/70 group-hover:border-white/30" style={{ fontSize: '10px', borderColor: 'var(--color-fog)', color: 'var(--color-ash)' }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TopicCatalogPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState('All');
  const [cefrFilter, setCefrFilter] = useState('All');
  const [joining, setJoining] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    topicsApi.list().then(r => setTopics(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = topics.filter(t => {
    if (tagFilter !== 'All' && !t.tags.includes(tagFilter)) return false;
    if (cefrFilter !== 'All' && !t.cefr_levels.includes(cefrFilter)) return false;
    return true;
  });

  const handleJoin = (topicId: string) => {
    setJoining(topicId);
    navigate(`/world/${topicId}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-12 py-16">
        <h1 className="font-display text-[56px] italic mb-2" style={{ color: 'var(--color-ink)' }}>Available Worlds</h1>
        <p className="font-body text-[15px] mb-12" style={{ color: 'var(--color-ash)' }}>
          Choose a conversation scenario to practice.
        </p>

        {/* Filters */}
        <div className="flex items-center mb-10 overflow-x-auto pb-2">
          <div className="flex items-center">
            {DOMAIN_FILTERS.map(d => (
              <FilterButton key={d} active={tagFilter === d} onClick={() => setTagFilter(d)}>{d}</FilterButton>
            ))}
          </div>
          <div className="w-px h-4 mx-4 flex-shrink-0" style={{ backgroundColor: 'var(--color-fog)' }} />
          <div className="flex items-center ml-auto">
            {CEFR_FILTERS.map(l => (
              <FilterButton key={l} active={cefrFilter === l} onClick={() => setCefrFilter(l)}>{l}</FilterButton>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 meta" style={{ fontSize: '11px' }}>Loading worlds...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-xl mb-2" style={{ color: 'var(--color-ink)' }}>No worlds match your filters</p>
            <p className="font-body text-sm" style={{ color: 'var(--color-ash)' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
            {filtered.map((topic, i) => (
              <div key={topic.id} className="animate-fade-up" style={{ animationDelay: `${(i + 1) * 60}ms` }}>
                <TopicCard
                  topic={topic}
                  onJoin={() => !joining && handleJoin(topic.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
