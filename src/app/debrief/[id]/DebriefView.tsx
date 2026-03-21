'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ScoreCard } from '@/components/debrief/ScoreCard';
import { HighlightReel } from '@/components/debrief/HighlightReel';
import { VocabLog } from '@/components/debrief/VocabLog';
import { useSessionStore } from '@/store/session-store';

export function DebriefView() {
  const params = useParams();
  const sessionId = params.id as string;
  const session = useSessionStore(s => s.getSession(sessionId));

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="text-center">
          <p className="font-display text-xl mb-4" style={{ color: 'var(--color-ink)' }}>Session not found</p>
          <Link href="/" className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-ink)' }}>
            Back to Worlds
          </Link>
        </div>
      </div>
    );
  }

  const { evaluation } = session;
  const mins = Math.floor(session.duration / 60);
  const secs = session.duration % 60;

  return (
    <div className="flex-1" style={{ backgroundColor: 'var(--color-paper)' }}>
      <nav className="h-14 border-b border-[var(--color-fog)] px-12 max-md:px-6 flex items-center justify-between">
        <Link href="/" className="font-display italic text-xl" style={{ color: 'var(--color-ink)' }}>
          LotusHack
        </Link>
        <Link href="/" className="font-body text-[13px] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--color-ash)]" style={{ color: 'var(--color-ink)' }}>
          Back to Worlds
        </Link>
      </nav>

      <div className="max-w-[900px] mx-auto px-12 max-md:px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="font-display text-[56px] max-md:text-[36px] font-normal italic leading-[1.1] mb-4" style={{ color: 'var(--color-ink)' }}>
            Session Debrief
          </h1>
          <p className="font-display text-[22px] mb-2" style={{ color: 'var(--color-ink)' }}>{session.worldTitle}</p>
          <p className="meta" style={{ fontSize: '11px' }}>
            {mins}M {secs}S &middot; {session.transcript.length} EXCHANGES
          </p>
        </div>

        {/* Overall Score */}
        <div className="text-center py-12 mb-12 border-t border-b border-[var(--color-fog)]">
          <span className="meta block mb-3" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>OVERALL SCORE</span>
          <span className="font-display text-[72px] font-normal leading-none" style={{ color: 'var(--color-ink)' }}>
            {evaluation.overall}
          </span>
        </div>

        {/* Three Dimension Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-16" style={{ backgroundColor: 'var(--color-fog)' }}>
          <div className="p-6 bg-[var(--color-surface)]">
            <ScoreCard label="Tone" dimension={evaluation.tone} />
          </div>
          <div className="p-6 bg-[var(--color-surface)]">
            <ScoreCard label="Content" dimension={evaluation.content} />
          </div>
          <div className="p-6 bg-[var(--color-surface)]">
            <ScoreCard label="First Voice" dimension={evaluation.firstVoice} />
          </div>
        </div>

        {/* Coach Narrative */}
        <div className="mb-16">
          <h2 className="meta mb-6" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>YOUR COACH SAYS</h2>
          <div className="border-l-2 border-[var(--color-ink)] pl-6">
            {evaluation.coachNarrative.split('\n').filter(Boolean).map((para: string, i: number) => (
              <p key={i} className="font-body text-[14px] leading-[1.8] mb-4" style={{ color: 'var(--color-ash)' }}>
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Highlight Reel */}
        <div className="mb-16">
          <h2 className="meta mb-6" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>KEY MOMENTS</h2>
          <HighlightReel highlights={evaluation.highlights} />
        </div>

        {/* Vocabulary */}
        <div className="mb-16">
          <h2 className="meta mb-6" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>VOCABULARY</h2>
          <VocabLog used={evaluation.vocabularyUsed} available={evaluation.vocabularyAvailable} />
        </div>

        {/* Divider */}
        <div className="h-px mb-12" style={{ backgroundColor: 'var(--color-fog)' }} />

        {/* CTA */}
        <div className="text-center pb-16">
          <p className="font-display text-[22px] italic mb-6" style={{ color: 'var(--color-ink)' }}>Ready for more?</p>
          <div className="flex items-center justify-center gap-8">
            <Link
              href={`/world/${session.worldId}`}
              className="font-body text-[13px] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--color-ash)]"
              style={{ color: 'var(--color-ink)' }}
            >
              Retry This World
            </Link>
            <Link
              href="/"
              className="font-body text-[13px] uppercase tracking-[0.1em] px-8 py-3.5 bg-[var(--color-ink)] text-white transition-opacity duration-200 hover:opacity-85"
            >
              Explore More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
