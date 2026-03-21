import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { sessionsApi } from '../services/api';

interface SessionHistoryItem {
  id: string;
  topic_id: string;
  status: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds: number;
  evaluation?: { composite_score: number };
  topic?: { title: string };
}

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        <span className="text-lg font-bold text-white">Lotus</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/topics" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Browse Topics</Link>
        {(user?.role === 'creator' || user?.role === 'admin') && (
          <Link to="/studio" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Studio</Link>
        )}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
            {user?.profile?.display_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-gray-300 text-sm">{user?.profile?.display_name}</span>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors text-sm ml-2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export { Navbar };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionsApi.history({ limit: 10 })
      .then(res => setSessions(res.data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.evaluation?.composite_score || 0), 0) / completedSessions.length)
    : 0;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {user?.profile?.display_name || 'Learner'} 👋
          </h1>
          <p className="text-gray-400">Here's your practice overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Sessions Completed" value={String(completedSessions.length)} icon="🎯" />
          <StatCard label="Average Score" value={avgScore > 0 ? `${avgScore}%` : '—'} icon="📊" />
          <StatCard
            label="CEFR Level"
            value={user?.cefr?.calibrated || user?.cefr?.self_assessed || 'Not set'}
            icon="📚"
          />
          <StatCard label="Role" value={user?.role || 'learner'} icon="👤" />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <QuickAction
            icon="🌐"
            title="Browse Topics"
            description="Explore conversation worlds and start practicing"
            to="/topics"
            color="from-primary-600 to-cyan-700"
          />
          {(user?.role === 'creator' || user?.role === 'admin') && (
            <QuickAction
              icon="🏗️"
              title="Creator Studio"
              description="Design conversation topics and AI characters"
              to="/studio"
              color="from-accent-600 to-purple-700"
            />
          )}
          <QuickAction
            icon="📈"
            title="View Progress"
            description="Review your session history and scores"
            to="#history"
            color="from-green-600 to-emerald-700"
          />
        </div>

        {/* Recent Sessions */}
        <div id="history">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Sessions</h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🎙️</div>
              <p className="text-gray-300 font-semibold text-lg mb-2">No sessions yet</p>
              <p className="text-gray-500 mb-6">Jump into a conversation to get started</p>
              <Link
                to="/topics"
                className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors"
              >
                Browse Topics
              </Link>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-gray-800">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => session.status === 'completed' && navigate(`/session/${session.id}/debrief`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl">
                        🎭
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {session.topic?.title || `Session ${session.id.slice(0, 8)}`}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {formatDate(session.started_at)} • {formatDuration(session.duration_seconds)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {session.evaluation && (
                        <span className={`text-lg font-bold ${getScoreColor(session.evaluation.composite_score)}`}>
                          {Math.round(session.evaluation.composite_score)}%
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {session.status}
                      </span>
                      {session.status === 'completed' && (
                        <span className="text-gray-500 text-xs">View debrief →</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}

function QuickAction({
  icon, title, description, to, color,
}: {
  icon: string; title: string; description: string; to: string; color: string;
}) {
  return (
    <Link to={to} className="block bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all group">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </Link>
  );
}
