import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sessionsApi, topicsApi } from '../services/api';
import { Topic } from '../types';
import { Navbar } from './DashboardPage';

export default function SessionLobbyPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [micChecked, setMicChecked] = useState(false);
  const [micError, setMicError] = useState('');
  const [micChecking, setMicChecking] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    sessionsApi.get(sessionId)
      .then(res => {
        const session = res.data;
        return topicsApi.get(session.topic_id);
      })
      .then(res => setTopic(res.data))
      .catch(() => navigate('/topics'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const checkMicPermission = async () => {
    setMicChecking(true);
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicChecked(true);
    } catch (e) {
      setMicError('Microphone access denied. Please allow microphone access in your browser settings.');
    } finally {
      setMicChecking(false);
    }
  };

  const handleEnter = () => {
    navigate(`/session/${sessionId}`);
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

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-8 py-12">
        {/* Session Info */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Session Ready
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {topic?.title || 'Conversation Session'}
          </h1>
          <p className="text-gray-400">
            You're about to join a conversation with {topic?.characters?.length || 0} AI character
            {topic?.characters?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Characters Preview */}
        {topic?.characters && topic.characters.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Your conversation partners</h2>
            <div className="space-y-3">
              {topic.characters.map(char => (
                <div key={char.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl">
                    {char.avatar_preset === 'professional' ? '👔' :
                     char.avatar_preset === 'academic' ? '🎓' :
                     char.avatar_preset === 'casual' ? '😊' : '🧑'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{char.name}</p>
                    <p className="text-gray-400 text-sm">{char.role}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-gray-700 rounded-lg text-xs text-gray-400">
                      {char.voice_id || 'Default voice'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span>💡</span>
            How it works
          </h2>
          <ul className="space-y-3 text-sm text-gray-400">
            {[
              'The AI characters will initiate the conversation. Listen carefully.',
              'Press the microphone button when you want to speak.',
              'Your performance is tracked in 3 dimensions: Tone, Content, and First Voice.',
              'First Voice score rewards you for initiating turns and asking questions.',
              'When done, press "End Session" to receive your personalized debrief.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Mic Check */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>🎙️</span>
            Microphone Check
          </h2>
          {micChecked ? (
            <div className="flex items-center gap-3 text-green-400">
              <span className="text-xl">✅</span>
              <span className="font-medium">Microphone ready!</span>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Allow microphone access so you can speak during the session.
              </p>
              {micError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {micError}
                </div>
              )}
              <button
                onClick={checkMicPermission}
                disabled={micChecking}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {micChecking ? 'Checking...' : 'Test Microphone'}
              </button>
            </>
          )}
        </div>

        {/* Enter Button */}
        <button
          onClick={handleEnter}
          className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg"
        >
          Enter Session
        </button>
        {!micChecked && (
          <p className="text-center text-gray-500 text-xs mt-3">
            You can still enter without mic check — you can enable it inside
          </p>
        )}
      </main>
    </div>
  );
}
