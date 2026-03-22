import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionsApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import type { SessionEvaluation } from '../types';

/* ── Animate-in hook: fades + slides up each section as it enters the viewport ── */
function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
  };

  return { ref, style };
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, style } = useRevealOnScroll();
  return (
    <div ref={ref} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Count-up animation for score numbers ── */
function AnimatedScore({ value, fontSize = '72px' }: { value: number; fontSize?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="font-display leading-none" style={{ fontSize, color: 'var(--color-text-primary)' }}>
      {display}
    </span>
  );
}

function AudioPlayer({ sessionId }: { sessionId: string }) {
  const [hasAudio, setHasAudio] = useState<boolean | null>(null);
  const audioUrl = sessionsApi.audioUrl(sessionId);

  useEffect(() => {
    // Check if audio exists by making a HEAD-like request
    fetch(audioUrl, { method: 'GET', headers: { Range: 'bytes=0-0' } })
      .then((res) => setHasAudio(res.ok))
      .catch(() => setHasAudio(false));
  }, [audioUrl]);

  if (hasAudio === null || !hasAudio) return null;

  return (
    <div className="mb-12">
      <h2 className="meta mb-5" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Session Recording</h2>
      <audio controls src={audioUrl} style={{ width: '100%' }}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

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

const MOCK_EVALUATION: SessionEvaluation = {
  composite_score: 0.72,
  tone: {
    score: 0.75,
    formality_calibration: 0.8,
    assertiveness: 0.65,
    emotional_congruence: 0.78,
  },
  content: {
    score: 0.68,
    topical_relevance: 0.82,
    logical_coherence: 0.7,
    vocabulary_range: 0.55,
    grammar_fluency_index: 0.64,
  },
  first_voice: {
    score: 0.73,
    speaking_time_ratio: 0.45,
    turn_initiation_count: 8,
    question_quality: 0.7,
    interruption_events: 1,
  },
  speaking: {
    fluency_score: 0.71,
    strengths: [
      'Good use of transitional phrases like "on the other hand" and "I understand your point"',
      'Maintained a professional and respectful tone throughout the negotiation',
      'Asked clarifying questions to understand the other party\'s position',
    ],
    improvements: [
      'Work on using more varied sentence structures to avoid repetition',
      'Practice expressing disagreement more directly while remaining polite',
      'Expand vocabulary related to compensation and benefits terminology',
    ],
    grammar_corrections: [
      {
        original: 'I was thinking around fifteen percent.',
        corrected: 'I was thinking of around fifteen percent.',
        explanation: 'The verb "think" requires the preposition "of" when followed by a quantity or amount.',
      },
      {
        original: 'Can we discuss about the benefits?',
        corrected: 'Can we discuss the benefits?',
        explanation: '"Discuss" is a transitive verb and does not require the preposition "about".',
      },
      {
        original: 'I have been working here since three years.',
        corrected: 'I have been working here for three years.',
        explanation: 'Use "for" with a duration of time, and "since" with a specific point in time.',
      },
    ],
    pronunciation_tips: [
      '"Compensation" — stress falls on the third syllable: com-pen-SA-tion',
      '"Negotiate" — avoid dropping the middle syllable: ne-GO-shi-ate, not "ne-go-ate"',
      '"Percentage" — the "t" is pronounced as a soft "t", not a hard stop',
    ],
    filler_words: ['um', 'uh', 'like', 'you know'],
  },
  highlight_reel: [
    {
      turn_id: '1',
      label: 'Strong Opening',
      coach_note: 'You opened the negotiation confidently by stating your desired raise clearly.',
    },
    {
      turn_id: '4',
      label: 'Good Recovery',
      coach_note: 'When challenged on your request, you recovered well by citing specific accomplishments.',
    },
    {
      turn_id: '7',
      label: 'Missed Opportunity',
      coach_note: 'When asked about market rates, a data-driven response would have strengthened your position.',
    },
  ],
  vocabulary_log: [
    { word: 'compensation', used_correctly: true, context: 'Let\'s talk about your compensation package.' },
    { word: 'leverage', used_correctly: true, context: 'I want to leverage my experience in this role.' },
    { word: 'benchmark', used_correctly: false, context: 'Could be used when discussing market salary rates.' },
    { word: 'counteroffer', used_correctly: false, context: 'Useful when the employer proposes a different amount.' },
    { word: 'merit-based', used_correctly: true, context: 'I believe in merit-based salary increases.' },
    { word: 'equity', used_correctly: false, context: 'Can refer to stock options or fairness in compensation.' },
  ],
  recommended_topic_ids: [],
  coach_narrative: 'You showed strong initiative in this salary negotiation, opening confidently and maintaining a professional tone throughout. Your ability to cite specific accomplishments was a highlight.\n\nTo improve, focus on building a stronger vocabulary around compensation terminology and practice structuring your arguments with data points. Work on reducing filler words — they can undermine confidence in high-stakes conversations like this one.',
};

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

  // Use mock data for development when no real evaluation is available
  const useMock = !loading && !evaluation;
  const displayEvaluation = evaluation || (useMock ? MOCK_EVALUATION : null);

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

  if (!displayEvaluation) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-12 py-16 text-center">
        <p className="font-display text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>Evaluation not available yet</p>
        <Link to="/topics" className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-text-secondary)' }}>Explore more worlds</Link>
      </div>
    </div>
  );

  const e = displayEvaluation;
  const overallPct = Math.round(e.composite_score * 100);
  const vocabUsed = e.vocabulary_log.filter(v => v.used_correctly).map(v => v.word);
  const vocabAvailable = e.vocabulary_log.filter(v => !v.used_correctly).map(v => v.word);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-12 py-16">
        {/* Header */}
        <AnimatedSection>
          <h1 className="font-display text-[56px] italic mb-2" style={{ color: 'var(--color-text-primary)' }}>Session Debrief</h1>
          <div className="flex items-center gap-4 mb-12">
            <span className="meta" style={{ fontSize: '11px' }}>
              {e.first_voice.turn_initiation_count} exchanges · {Math.round(e.first_voice.speaking_time_ratio * 100)}% speaking time
            </span>
          </div>
        </AnimatedSection>

        {/* Overall score */}
        <AnimatedSection delay={150}>
          <div className="text-center py-12 mb-12 border-t border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span className="meta block mb-4" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>Overall Score</span>
            <AnimatedScore value={overallPct} />
          </div>
        </AnimatedSection>

        {/* Session recording playback */}
        {sessionId && <AnimatedSection delay={200}><AudioPlayer sessionId={sessionId} /></AnimatedSection>}

        {/* 3 Dimension scores */}
        <AnimatedSection delay={250}>
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
        </AnimatedSection>

        {/* Speaking Evaluation */}
        {e.speaking && (<AnimatedSection>
          <div className="mb-12">
            <h2 className="meta mb-5" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Speaking Evaluation</h2>

            {/* Fluency score */}
            <div className="mb-6 p-5" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>FLUENCY</span>
                <span className="font-display text-[28px]" style={{ color: 'var(--color-text-primary)' }}>
                  {Math.round(e.speaking.fluency_score * 100)}
                </span>
              </div>
              <div className="relative" style={{ height: '2px', backgroundColor: 'var(--color-border)' }}>
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-1000"
                  style={{ width: `${Math.round(e.speaking.fluency_score * 100)}%`, backgroundColor: 'var(--color-accent)' }}
                />
              </div>
            </div>

            {/* Strengths & Improvements side by side */}
            {(e.speaking.strengths.length > 0 || e.speaking.improvements.length > 0) && (
              <div className="grid grid-cols-2 gap-px mb-6" style={{ backgroundColor: 'var(--color-border)' }}>
                <div className="p-5" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <h4 className="meta mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Strengths</h4>
                  <ul className="space-y-2">
                    {e.speaking.strengths.map((s, i) => (
                      <li key={i} className="font-body text-[13px] leading-relaxed flex gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <span style={{ color: 'var(--color-accent)' }}>+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                    {e.speaking.strengths.length === 0 && (
                      <p className="font-body text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>Keep practicing!</p>
                    )}
                  </ul>
                </div>
                <div className="p-5" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <h4 className="meta mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Areas to Improve</h4>
                  <ul className="space-y-2">
                    {e.speaking.improvements.map((s, i) => (
                      <li key={i} className="font-body text-[13px] leading-relaxed flex gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <span style={{ color: 'var(--color-accent)' }}>~</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Grammar Corrections */}
            {e.speaking.grammar_corrections.length > 0 && (
              <div className="mb-6">
                <h4 className="meta mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Grammar Corrections</h4>
                <div className="space-y-3">
                  {e.speaking.grammar_corrections.map((g, i) => (
                    <div key={i} className="p-4 border" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-start gap-3 mb-2">
                        <span className="font-body text-[13px] line-through" style={{ color: 'var(--color-text-secondary)' }}>{g.original}</span>
                        <span className="meta" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>&rarr;</span>
                        <span className="font-body text-[13px] font-medium" style={{ color: 'var(--color-accent)' }}>{g.corrected}</span>
                      </div>
                      <p className="font-body text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{g.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pronunciation Tips */}
            {e.speaking.pronunciation_tips.length > 0 && (
              <div className="mb-6">
                <h4 className="meta mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Pronunciation Tips</h4>
                <ul className="space-y-2">
                  {e.speaking.pronunciation_tips.map((tip, i) => (
                    <li key={i} className="font-body text-[13px] leading-relaxed pl-4" style={{ color: 'var(--color-text-primary)', borderLeft: '2px solid var(--color-border)' }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Filler Words */}
            {e.speaking.filler_words.length > 0 && (
              <div className="mb-6">
                <h4 className="meta mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Filler Words Detected</h4>
                <div className="flex flex-wrap gap-1.5">
                  {e.speaking.filler_words.map((w, i) => (
                    <span key={i} className="meta px-2 py-1 border" style={{ fontSize: '10px', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }}>
                      {w.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>)}

        {/* Coach narrative */}
        {e.coach_narrative && (<AnimatedSection>
          <div className="mb-12">
            <h2 className="meta mb-5" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>Your Coach Says</h2>
            <div className="pl-6 font-body text-[15px] leading-relaxed" style={{ borderLeft: '2px solid var(--color-accent)', color: 'var(--color-text-primary)' }}>
              {e.coach_narrative.split('\n').map((p, i) => p.trim() && <p key={i} className="mb-3">{p}</p>)}
            </div>
          </div>
        </AnimatedSection>)}

        {/* Highlight reel */}
        {e.highlight_reel.length > 0 && (<AnimatedSection>
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
        </AnimatedSection>)}

        {/* Vocab log */}
        {e.vocabulary_log.length > 0 && (<AnimatedSection>
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
        </AnimatedSection>)}

        {/* CTA */}
        <AnimatedSection>
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
        </AnimatedSection>
      </div>
    </div>
  );
}
