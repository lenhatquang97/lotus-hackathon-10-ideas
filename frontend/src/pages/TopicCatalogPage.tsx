import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { topicsApi, sessionsApi } from '../services/api';
import { Topic } from '../types';
import { Navbar } from './DashboardPage';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function TopicCatalogPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState('');
  const [cefrFilter, setCefrFilter] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    loadTopics();
  }, [tagFilter, cefrFilter]);

  const loadTopics = () => {
    setLoading(true);
    topicsApi
      .list({
        tags: tagFilter || undefined,
        cefr: cefrFilter || undefined,
      })
      .then(res => setTopics(res.data))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  };

  const handleJoin = async (topicId: string) => {
    setJoiningId(topicId);
    try {
      const res = await sessionsApi.create(topicId);
      const sessionId = res.data.id;
      navigate(`/session/${sessionId}/lobby`);
    } catch (e) {
      console.error('Failed to create session', e);
    } finally {
      setJoiningId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Conversation Topics</h1>
          <p className="text-gray-400">Choose a world to practice in — each with unique AI characters</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="Search by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
            />
          </div>
          <select
            value={cefrFilter}
            onChange={(e) => setCefrFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm"
          >
            <option value="">All CEFR Levels</option>
            {CEFR_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <button
            onClick={() => { setTagFilter(''); setCefrFilter(''); }}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Clear filters
          </button>
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🌐</div>
            <p className="text-gray-300 text-xl font-semibold mb-2">No topics found</p>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onJoin={handleJoin}
                joining={joiningId === topic.id}
                getScoreColor={getScoreColor}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TopicCard({
  topic,
  onJoin,
  joining,
  getScoreColor,
}: {
  topic: Topic;
  onJoin: (id: string) => void;
  joining: boolean;
  getScoreColor: (score: number) => string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all group">
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-1.5">
            {topic.cefr_levels?.map(level => (
              <span key={level} className="px-2 py-0.5 bg-accent-500/20 text-accent-400 rounded-md text-xs font-medium">
                {level}
              </span>
            ))}
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
            topic.status === 'published'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {topic.status}
          </span>
        </div>

        <Link to={`/topics/${topic.id}`}>
          <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors leading-snug">
            {topic.title}
          </h3>
        </Link>
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{topic.description}</p>
      </div>

      {/* Tags */}
      {topic.tags?.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {topic.tags.slice(0, 4).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-md text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="px-6 pb-4 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-800 pt-4">
        <span className="flex items-center gap-1">
          <span>🎭</span>
          {topic.characters?.length || 0} characters
        </span>
        <span className="flex items-center gap-1">
          <span>▶️</span>
          {topic.play_count || 0} plays
        </span>
        {topic.avg_score > 0 && (
          <span className={`flex items-center gap-1 font-medium ${getScoreColor(topic.avg_score)}`}>
            <span>⭐</span>
            {Math.round(topic.avg_score * 100)}% avg
          </span>
        )}
      </div>

      {/* Action */}
      <div className="px-6 pb-6">
        <button
          onClick={() => onJoin(topic.id)}
          disabled={joining}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {joining ? 'Starting...' : 'Join Conversation'}
        </button>
      </div>
    </div>
  );
}
