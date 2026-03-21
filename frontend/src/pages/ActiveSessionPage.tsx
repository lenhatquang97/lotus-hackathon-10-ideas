import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../stores/sessionStore';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { topicsApi, sessionsApi } from '../services/api';
import { TranscriptTurn } from '../types';

export default function ActiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = useSessionStore();
  const { startSession, endSession, toggleMic } = useSessionSocket(sessionId!);

  useEffect(() => {
    if (!sessionId) return;
    sessionsApi.get(sessionId).then(res => {
      store.setSession(res.data);
      // Load topic info for character display
      return topicsApi.get(res.data.topic_id);
    }).then(res => {
      store.setTopic(res.data);
    }).catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    const timer = setTimeout(() => startSession(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleEndSession = async () => {
    endSession();
    try {
      await sessionsApi.end(sessionId!);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => navigate(`/session/${sessionId}/debrief`), 1000);
  };

  const { liveScores, transcript, activeSpeaker, showSilenceOverlay, isMicActive, topic } = store;
  const topicData = topic as { characters?: Array<{ id: string; name: string; role: string; avatar_preset: string }> } | null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-gray-950 to-gray-950 pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/3 w-72 h-72 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main layout */}
      <div className="relative z-10 flex flex-col h-screen">

        {/* Top HUD - Live Scores */}
        <div className="shrink-0">
          <HUDArc scores={liveScores} />
        </div>

        {/* Agent Cards */}
        <div className="shrink-0 flex justify-center gap-6 mt-4 px-8 flex-wrap">
          {topicData?.characters?.map((char) => (
            <AgentCard
              key={char.id}
              character={char}
              isSpeaking={activeSpeaker?.character_id === char.id}
            />
          ))}
          {(!topicData?.characters || topicData.characters.length === 0) && (
            <div className="flex gap-6">
              {[1, 2].map(i => (
                <div key={i} className="flex flex-col items-center gap-2 opacity-30 animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-gray-700 border-4 border-gray-600" />
                  <div className="w-20 h-3 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transcript Feed */}
        <div className="flex-1 overflow-y-auto px-8 py-4 mt-4">
          <div className="max-w-3xl mx-auto w-full">
            <TranscriptFeed turns={transcript} />
          </div>
        </div>

        {/* Silence Overlay */}
        {showSilenceOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
              <div className="text-5xl mb-4 animate-bounce">🤫</div>
              <p className="text-white text-xl font-semibold mb-2">It's your turn to speak!</p>
              <p className="text-gray-400">Press the mic button and share your thoughts</p>
            </div>
          </div>
        )}

        {/* Audio Control Bar */}
        <div className="shrink-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 px-8 py-4">
          <div className="flex items-center justify-center gap-8 max-w-lg mx-auto">
            {/* Mic toggle */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={toggleMic}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  isMicActive
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 scale-110'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isMicActive ? '🎙️' : '🎤'}
              </button>
              <span className="text-xs text-gray-500">{isMicActive ? 'Tap to mute' : 'Tap to speak'}</span>
            </div>

            {/* Waveform animation when mic active */}
            {isMicActive && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="w-1.5 bg-green-400 rounded-full animate-bounce"
                    style={{
                      height: `${Math.random() * 20 + 8}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* End Session */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleEndSession}
                className="px-6 py-3 bg-gray-700 hover:bg-red-800 text-white rounded-xl font-medium transition-all"
              >
                End Session
              </button>
              <span className="text-xs text-gray-500">Go to debrief</span>
            </div>
          </div>

          {isMicActive && (
            <p className="text-center text-green-400 text-sm mt-2 animate-pulse font-medium">
              Recording — speak naturally
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// HUDArc Component
function HUDArc({
  scores,
}: {
  scores: { tone: number; content: number; first_voice: number };
}) {
  return (
    <div className="flex justify-center pt-4 px-8">
      <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl px-10 py-4 flex items-center gap-10 shadow-lg">
        <ScoreSegment label="Tone" value={scores.tone} color="#a78bfa" />
        <div className="w-px h-12 bg-gray-700" />
        <ScoreSegment label="Content" value={scores.content} color="#34d399" />
        <div className="w-px h-12 bg-gray-700" />
        <ScoreSegment label="First Voice" value={scores.first_voice} color="#60a5fa" />
      </div>
    </div>
  );
}

function ScoreSegment({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.round(value * 100);
  const circumference = 2 * Math.PI * 22;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#1f2937" strokeWidth="5" />
          <circle
            cx="28"
            cy="28"
            r="22"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {pct}
        </span>
      </div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

// AgentCard Component
function AgentCard({
  character,
  isSpeaking,
}: {
  character: { id: string; name: string; role: string; avatar_preset: string };
  isSpeaking: boolean;
}) {
  const avatarEmoji =
    character.avatar_preset === 'professional'
      ? '👔'
      : character.avatar_preset === 'academic'
      ? '🎓'
      : character.avatar_preset === 'casual'
      ? '😊'
      : '🧑';

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-all duration-300 ${
        isSpeaking ? 'scale-110' : 'scale-100'
      }`}
    >
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 bg-gray-800 transition-all duration-300 ${
          isSpeaking
            ? 'border-green-400 shadow-lg shadow-green-400/40'
            : 'border-gray-600'
        }`}
      >
        {avatarEmoji}
      </div>

      {/* Speaking wave animation */}
      {isSpeaking && (
        <div className="flex gap-1 items-end h-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-green-400"
              style={{
                animation: 'bounce 0.6s infinite',
                animationDelay: `${i * 0.1}s`,
                height: `${[12, 18, 14, 10][i - 1]}px`,
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center">
        <p className="text-white font-semibold text-sm">{character.name}</p>
        <p className="text-gray-400 text-xs">{character.role}</p>
      </div>
    </div>
  );
}

// TranscriptFeed Component
function TranscriptFeed({ turns }: { turns: TranscriptTurn[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  if (turns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-sm">Conversation will appear here...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {turns.map((turn) => (
        <div
          key={turn.turn_id}
          className={`flex ${turn.speaker === 'learner' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
              turn.speaker === 'learner'
                ? 'bg-primary-600 text-white rounded-br-sm'
                : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-sm'
            }`}
          >
            {turn.speaker === 'character' && turn.character_name && (
              <p className="text-xs text-primary-400 mb-1.5 font-semibold">{turn.character_name}</p>
            )}
            <p className="text-sm leading-relaxed">{turn.text}</p>
            {/* Mini score snapshot */}
            {turn.evaluation_snapshot && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                <MiniScore value={turn.evaluation_snapshot.tone_score} color="#a78bfa" label="T" />
                <MiniScore value={turn.evaluation_snapshot.content_score} color="#34d399" label="C" />
                <MiniScore value={turn.evaluation_snapshot.first_voice_score} color="#60a5fa" label="F" />
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MiniScore({ value, color, label }: { value: number; color: string; label: string }) {
  if (!value) return null;
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {label}:{Math.round(value * 100)}
    </span>
  );
}
