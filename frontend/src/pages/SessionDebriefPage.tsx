import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionsApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import type { SessionEvaluation } from '../types';

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="meta flex-1 text-left" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
        {label.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
      </span>
      <div className="relative" style={{ width: '48px', height: '1px', backgroundColor: 'var(--color-border)' }}>
        <div className="absolute top-0 left-0 h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: 'var(--color-accent)' }} />
      </div>
      <span className="meta text-right" style={{ fontSize: '9px', width: '20px', fontFamily: 'var(--font-mono)' }}>{pct}</span>
    </div>
  );
}

function ScoreCard({ label, score, subMetrics }: { label: string; score: number; subMetrics: Record<string, number> }) {
  return (
    <div className="text-center">
      <span className="meta block mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>{label.toUpperCase()}</span>
      <span className="font-display block mb-4 leading-none" style={{ fontSize: '48px', color: 'var(--color-text-primary)' }}>
        {Math.round(score * 100)}
      </span>
      <div className="space-y-2">
        {Object.entries(subMetrics).map(([k, v]) => (
          <ScoreBar key={k} label={k} value={v as number} />
        ))}
      </div>
    </div>
  );
}

export default function SessionDebriefPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [evaluation, setEvaluation] = useState<SessionEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        const [evalRes] = await Promise.all([
          sessionsApi.evaluation(sessionId),
          sessionsApi.get(sessionId),
        ]);
        setEvaluation(evalRes.data);
      } catch {
        try {
          const s = await sessionsApi.get(sessionId);
          if (s.data.evaluation) setEvaluation(s.data.evaluation);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
          <p className="meta" style={{ fontSize: '11px' }}>Generating your debrief...</p>
        </div>
      </div>
    </div>
  );

  if (!evaluation) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-12 py-16 text-center">
        <p className="font-display text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>Evaluation not available yet</p>
        <Link to="/topics" className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-text-secondary)' }}>Explore more worlds</Link>
      </div>
    </div>
  );

  const e = evaluation;
  const overallPct = Math.round(e.composite_score * 100);
  const vocabUsed = e.vocabulary_log.filter(v => v.used_correctly).map(v => v.word);
  const vocabAvailable = e.vocabulary_log.filter(v => !v.used_correctly).map(v => v.word);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-12 py-16">
        {/* Header */}
        <h1 className="font-display text-[56px] italic mb-2" style={{ color: 'var(--color-text-primary)' }}>Session Debrief</h1>
        <div className="flex items-center gap-4 mb-12">
          <span className="meta" style={{ fontSize: '11px' }}>
            {e.first_voice.turn_initiation_count} exchanges · {Math.round(e.first_voice.speaking_time_ratio * 100)}% speaking time
          </span>
        </div>

        {/* Overall score */}
        <div className="text-center py-12 mb-12 border-t border-b" style={{ borderColor: 'var(--color-border)' }}>
          <span className="meta block mb-4" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>Overall Score</span>
          <span className="font-display leading-none" style={{ fontSize: '72px', color: 'var(--color-text-primary)' }}>{overallPct}</span>
        </div>

        {/* 3 Dimension scores */}
        <div className="grid grid-cols-3 gap-px mb-12" style={{ backgroundColor: 'var(--color-border)' }}>
          <div className="p-8" style={{ backgroundColor: 'var(--color-surface)' }}>
            <ScoreCard
              label="Tone"
              score={e.tone.score}
              subMetrics={{ formality: e.tone.formality_calibration, assertiveness: e.tone.assertiveness, emotionalCongruence: e.tone.emotional_congruence }}
            />
          </div>
          <div className="p-8" style={{ backgroundColor: 'var(--color-surface)' }}>
            <ScoreCard
              label="Content"
              score={e.content.score}
              subMetrics={{ topicalRelevance: e.content.topical_relevance, logicalCoherence: e.content.logical_coherence, vocabularyRange: e.content.vocabulary_range, grammarFluency: e.content.grammar_fluency_index }}
            />
          </div>
          <div className="p-8" style={{ backgroundColor: 'var(--color-surface)' }}>
            <ScoreCard
              label="First Voice"
              score={e.first_voice.score}
              subMetrics={{ speakingTime: e.first_voice.speaking_time_ratio, questionQuality: e.first_voice.question_quality }}
            />
          </div>
        </div>

        {/* Coach narrative */}
        {e.coach_narrative && (
          <div className="mb-12">
            <h2 className="meta mb-5" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Your Coach Says</h2>
            <div className="pl-6 font-body text-[15px] leading-relaxed" style={{ borderLeft: '2px solid var(--color-accent)', color: 'var(--color-text-primary)' }}>
              {e.coach_narrative.split('\n').map((p, i) => p.trim() && <p key={i} className="mb-3">{p}</p>)}
            </div>
          </div>
        )}

        {/* Highlight reel */}
        {e.highlight_reel.length > 0 && (
          <div className="mb-12">
            <h2 className="meta mb-5" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Highlight Reel</h2>
            <div className="space-y-4">
              {e.highlight_reel.map((h, i) => (
                <div key={i} className="py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="meta" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>{h.label}</span>
                  </div>
                  <p className="font-body text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{h.coach_note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vocab log */}
        {e.vocabulary_log.length > 0 && (
          <div className="mb-12">
            <h2 className="meta mb-5" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Vocabulary</h2>
            <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: 'var(--color-border)' }}>
              <div className="p-5" style={{ backgroundColor: 'var(--color-surface)' }}>
                <h4 className="meta mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Words You Used</h4>
                <div className="flex flex-wrap gap-1.5">
                  {vocabUsed.map((w, i) => (
                    <span key={i} className="meta px-2 py-1 border" style={{ fontSize: '10px', borderColor: 'var(--color-border)' }}>{w.toUpperCase()}</span>
                  ))}
                  {vocabUsed.length === 0 && <p className="font-body text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>No notable vocabulary</p>}
                </div>
              </div>
              <div className="p-5" style={{ backgroundColor: 'var(--color-surface)' }}>
                <h4 className="meta mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Try These Next Time</h4>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {vocabAvailable.map((w, i) => (
                    <span key={i} className="meta px-2 py-1 border" style={{ fontSize: '10px', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }}>{w.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-display text-[22px] italic mb-6" style={{ color: 'var(--color-text-primary)' }}>Ready for more?</p>
          <div className="flex items-center justify-center gap-8">
            <button onClick={() => navigate(-1)} className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-text-secondary)' }}>
              Retry
            </button>
            <Link to="/topics" className="font-body text-[13px] uppercase tracking-[0.1em] px-8 py-3 transition-opacity hover:opacity-85"
              style={{ backgroundColor: 'var(--color-accent)', color: '#0D0B14' }}>
              Explore More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
