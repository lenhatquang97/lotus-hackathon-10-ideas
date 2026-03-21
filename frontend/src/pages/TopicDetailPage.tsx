import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { topicsApi, sessionsApi } from '../services/api';
import { Topic, Character } from '../types';
import { Navbar } from './DashboardPage';

export default function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [expandedBias, setExpandedBias] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;
    topicsApi.get(topicId)
      .then(res => setTopic(res.data))
      .catch(() => navigate('/topics'))
      .finally(() => setLoading(false));
  }, [topicId]);

  const handleStart = async () => {
    if (!topicId) return;
    setStarting(true);
    try {
      const res = await sessionsApi.create(topicId);
      navigate(`/session/${res.data.id}/lobby`);
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!topic) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-8 py-10">
        {/* Back */}
        <Link
          to="/topics"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
        >
          ← Back to Topics
        </Link>

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {topic.cefr_levels?.map(level => (
                <span key={level} className="px-3 py-1 bg-accent-500/20 text-accent-400 rounded-lg text-sm font-medium">
                  {level}
                </span>
              ))}
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                topic.status === 'published'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {topic.status}
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">{topic.title}</h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">{topic.description}</p>

          {/* Tags */}
          {topic.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {topic.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-6 text-sm text-gray-400 border-t border-gray-800 pt-6">
            <span className="flex items-center gap-2">
              <span className="text-xl">🎭</span>
              {topic.characters?.length || 0} AI characters
            </span>
            <span className="flex items-center gap-2">
              <span className="text-xl">▶️</span>
              {topic.play_count || 0} sessions played
            </span>
            {topic.avg_score > 0 && (
              <span className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                {Math.round(topic.avg_score * 100)}% average score
              </span>
            )}
          </div>
        </div>

        {/* Domain Knowledge */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>📖</span>
            Background Knowledge
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm">{topic.domain_knowledge}</p>
        </div>

        {/* Characters */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Meet the Characters</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {topic.characters?.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                expandedBias={expandedBias}
                setExpandedBias={setExpandedBias}
              />
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleStart}
            disabled={starting}
            className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-primary-600/20"
          >
            {starting ? 'Preparing session...' : 'Start Practice Session'}
          </button>
          <Link
            to="/topics"
            className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-medium transition-colors"
          >
            Back
          </Link>
        </div>
      </main>
    </div>
  );
}

function CharacterCard({
  character,
  expandedBias,
  setExpandedBias,
}: {
  character: Character;
  expandedBias: string | null;
  setExpandedBias: (id: string | null) => void;
}) {
  const isExpanded = expandedBias === character.id;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl shrink-0">
          {character.avatar_preset === 'professional' ? '👔' :
           character.avatar_preset === 'academic' ? '🎓' :
           character.avatar_preset === 'casual' ? '😊' : '🧑'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg">{character.name}</h3>
          <p className="text-primary-400 text-sm font-medium">{character.role}</p>
        </div>
      </div>

      <p className="text-gray-400 text-sm leading-relaxed mt-4">{character.persona}</p>

      <button
        onClick={() => setExpandedBias(isExpanded ? null : character.id)}
        className="mt-3 text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
      >
        {isExpanded ? '▲ Hide' : '▼ Show'} communication style
      </button>

      {isExpanded && (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-gray-300 font-medium">Communication style: </span>
            {character.bias_perception}
          </p>
        </div>
      )}
    </div>
  );
}
