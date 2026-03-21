import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { topicsApi } from '../services/api';
import { Topic } from '../types';
import { Navbar } from './DashboardPage';

export default function StudioDashboardPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = () => {
    setLoading(true);
    topicsApi.myTopics()
      .then(res => setTopics(res.data))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  };

  const handlePublish = async (topicId: string) => {
    setPublishing(topicId);
    try {
      await topicsApi.publish(topicId);
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, status: 'published' } : t));
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    setDeleting(topicId);
    try {
      await topicsApi.delete(topicId);
      setTopics(prev => prev.filter(t => t.id !== topicId));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const totalPlays = topics.reduce((sum, t) => sum + (t.play_count || 0), 0);
  const publishedCount = topics.filter(t => t.status === 'published').length;
  const avgScore = topics.filter(t => t.avg_score > 0).length > 0
    ? topics.filter(t => t.avg_score > 0).reduce((sum, t) => sum + t.avg_score, 0) / topics.filter(t => t.avg_score > 0).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Creator Studio</h1>
            <p className="text-gray-400">Design conversation worlds and AI characters</p>
          </div>
          <Link
            to="/studio/topics/create"
            className="px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Create New Topic
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StudioStat label="Total Topics" value={String(topics.length)} icon="🌐" />
          <StudioStat label="Published" value={String(publishedCount)} icon="✅" />
          <StudioStat label="Total Plays" value={String(totalPlays)} icon="▶️" />
          <StudioStat
            label="Avg Score"
            value={avgScore > 0 ? `${Math.round(avgScore * 100)}%` : '—'}
            icon="⭐"
          />
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-10 h-10 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🏗️</div>
            <h3 className="text-white text-xl font-semibold mb-2">No topics yet</h3>
            <p className="text-gray-500 mb-6">Create your first conversation world</p>
            <Link
              to="/studio/topics/create"
              className="inline-block px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl font-medium transition-colors"
            >
              Create Topic
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {topics.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onPublish={handlePublish}
                onDelete={handleDelete}
                publishing={publishing === topic.id}
                deleting={deleting === topic.id}
                onEdit={(id) => navigate(`/studio/topics/${id}/edit`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StudioStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}

function TopicCard({
  topic,
  onPublish,
  onDelete,
  onEdit,
  publishing,
  deleting,
}: {
  topic: Topic;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  publishing: boolean;
  deleting: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-colors">
      {/* Status + Title */}
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
          topic.status === 'published'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {topic.status === 'published' ? 'Published' : 'Draft'}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>🎭</span>
          {topic.characters?.length || 0} chars
        </div>
      </div>

      <h3 className="text-white font-semibold text-base mb-2 leading-snug">{topic.title}</h3>

      <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{topic.description}</p>

      {/* CEFR tags */}
      {topic.cefr_levels?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {topic.cefr_levels.map(level => (
            <span key={level} className="px-2 py-0.5 bg-accent-500/20 text-accent-400 rounded-md text-xs font-medium">
              {level}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span>{topic.play_count || 0} plays</span>
        {topic.avg_score > 0 && (
          <span className="text-green-400">{Math.round(topic.avg_score * 100)}% avg</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(topic.id)}
          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Edit
        </button>
        {topic.status === 'draft' && (
          <button
            onClick={() => onPublish(topic.id)}
            disabled={publishing}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {publishing ? '...' : 'Publish'}
          </button>
        )}
        <button
          onClick={() => onDelete(topic.id)}
          disabled={deleting}
          className="py-2 px-3 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-lg text-sm transition-colors"
        >
          {deleting ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  );
}
