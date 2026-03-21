'use client';

import type { Highlight } from '@/lib/types';

export function HighlightReel({ highlights }: { highlights: Highlight[] }) {
  return (
    <div className="space-y-4">
      {highlights.map((h, i) => (
        <div
          key={i}
          className="py-4 border-t border-[var(--color-fog)]"
        >
          <div className="flex items-baseline gap-3 mb-2">
            <span className="meta" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
              {h.type === 'positive' ? 'STRONG MOMENT' : 'GROWTH AREA'}
            </span>
            <span className="meta" style={{ fontSize: '9px' }}>
              {Math.floor(h.timestamp / 60)}:{(h.timestamp % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <p className="font-display text-[16px] italic mb-1.5" style={{ color: 'var(--color-ink)' }}>
            &ldquo;{h.text}&rdquo;
          </p>
          <p className="font-body text-[12px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            {h.explanation}
          </p>
        </div>
      ))}
    </div>
  );
}
