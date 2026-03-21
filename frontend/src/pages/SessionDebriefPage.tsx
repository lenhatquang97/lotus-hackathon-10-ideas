import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sessionsApi, topicsApi } from '../services/api';
import { SessionEvaluation } from '../types';
import { Navbar } from './DashboardPage';

interface DebriefData {
  evaluation: SessionEvaluation;
  topicId: string;
}

export default function SessionDebriefPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DebriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      sessionsApi.get(sessionId),
      sessionsApi.evaluation(sessionId),
    ]).then(([sessionRes, evalRes]) => {
      setData({
        evaluation: evalRes.data,
        topicId: sessionRes.data.topic_id,
      });
    }).catch(() => {
      // Try loading from session data directly
      sessionsApi.get(sessionId).then(res => {
        if (res.data.evaluation) {
          setData({ evaluation: res.data.evaluation, topicId: res.data.topic_id });
        }
      }).catch(console.error);
    }).finally(() => setLoading(false));
  }, [sessionId]);

  const handleTryAgain = async () => {
    if (!data?.topicId) return;
    setRetrying(true);
    try {
      const res = await sessionsApi.create(data.topicId);
      navigate(`/session/${res.data.id}/lobby`);
    } catch (e) {
      console.error(e);
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your session report...</p>
        </div>
      </div>
    );
  }

  if (!data?.evaluation) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-2xl mx-auto px-8 py-16 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-white mb-3">Report being generated...</h1>
          <p className="text-gray-400 mb-8">
            Your session evaluation is still processing. Please check back in a moment.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/topics" className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors">
              Browse Topics
            </Link>
            <Link to="/dashboard" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { evaluation } = data;
  const score = Math.round(evaluation.composite_score * 100);

  const scoreGrade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs work';
  const scoreColor = score >= 85 ? 'text-green-400' : score >= 70 ? 'text-yellow-400' : score >= 55 ? 'text-orange-400' : 'text-red-400';
  const scoreBg = score >= 85 ? 'bg-green-500/20 border-green-500/30' : score >= 70 ? 'bg-yellow-500/20 border-yellow-500/30' : score >= 55 ? 'bg-orange-500/20 border-orange-500/30' : 'bg-red-500/20 border-red-500/30';

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
            Session Complete
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Session Report</h1>
          <p className="text-gray-400">Here's how you performed</p>
        </div>

        {/* Composite Score */}
        <div className={`border rounded-3xl p-8 text-center mb-8 ${scoreBg}`}>
          <div className={`text-7xl font-bold mb-2 ${scoreColor}`}>{score}</div>
          <div className={`text-2xl font-semibold mb-1 ${scoreColor}`}>{scoreGrade}</div>
          <p className="text-gray-400 text-sm">Composite Score (out of 100)</p>
        </div>

        {/* 3 Dimension Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <DimensionCard
            title="Tone"
            icon="🎭"
            score={evaluation.tone.score}
            color="#a78bfa"
            metrics={[
              { label: 'Formality', value: evaluation.tone.formality_calibration },
              { label: 'Assertiveness', value: evaluation.tone.assertiveness },
              { label: 'Emotional Match', value: evaluation.tone.emotional_congruence },
            ]}
          />
          <DimensionCard
            title="Content"
            icon="📚"
            score={evaluation.content.score}
            color="#34d399"
            metrics={[
              { label: 'Topical Relevance', value: evaluation.content.topical_relevance },
              { label: 'Coherence', value: evaluation.content.logical_coherence },
              { label: 'Vocabulary Range', value: evaluation.content.vocabulary_range },
              { label: 'Grammar', value: evaluation.content.grammar_fluency_index },
            ]}
          />
          <DimensionCard
            title="First Voice"
            icon="🗣️"
            score={evaluation.first_voice.score}
            color="#60a5fa"
            metrics={[
              { label: 'Speaking Time', value: evaluation.first_voice.speaking_time_ratio },
              { label: 'Turn Initiation', value: Math.min(evaluation.first_voice.turn_initiation_count / 5, 1) },
              { label: 'Question Quality', value: evaluation.first_voice.question_quality },
            ]}
          />
        </div>

        {/* Coach Narrative */}
        {evaluation.coach_narrative && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span>🧑‍🏫</span>
              Coach Feedback
            </h2>
            <div className="prose prose-invert max-w-none">
              {evaluation.coach_narrative.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-gray-300 leading-relaxed mb-3 last:mb-0 text-sm">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Highlight Reel */}
        {evaluation.highlight_reel && evaluation.highlight_reel.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span>✨</span>
              Key Moments
            </h2>
            <div className="space-y-3">
              {evaluation.highlight_reel.map((item, i) => (
                <div key={i} className="flex gap-4 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-accent-500/20 text-accent-400 flex items-center justify-center text-sm shrink-0 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium mb-1">{item.label}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.coach_note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vocabulary Log */}
        {evaluation.vocabulary_log && evaluation.vocabulary_log.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span>📝</span>
              Vocabulary Analysis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left pb-3 text-gray-400 font-medium">Word</th>
                    <th className="text-left pb-3 text-gray-400 font-medium">Usage</th>
                    <th className="text-left pb-3 text-gray-400 font-medium">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {evaluation.vocabulary_log.map((entry, i) => (
                    <tr key={i}>
                      <td className="py-3 text-white font-mono font-medium">{entry.word}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          entry.used_correctly
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {entry.used_correctly ? 'Correct' : 'Review'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs max-w-xs truncate">{entry.context}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/topics"
            className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-center transition-colors"
          >
            Try Another Topic
          </Link>
          <button
            onClick={handleTryAgain}
            disabled={retrying}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
          >
            {retrying ? 'Starting...' : 'Try Again'}
          </button>
          <Link
            to="/dashboard"
            className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-semibold text-center transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

function DimensionCard({
  title,
  icon,
  score,
  color,
  metrics,
}: {
  title: string;
  icon: string;
  score: number;
  color: string;
  metrics: Array<{ label: string; value: number }>;
}) {
  const pct = Math.round(score * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        <span className="text-xl font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      <div className="space-y-2.5">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{metric.label}</span>
              <span className="text-xs text-gray-300 font-medium tabular-nums">
                {Math.round((metric.value || 0) * 100)}%
              </span>
            </div>
            <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((metric.value || 0) * 100)}%`,
                  backgroundColor: color,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
