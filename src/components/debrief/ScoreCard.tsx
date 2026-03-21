'use client';

import type { DimensionScore } from '@/lib/types';

interface ScoreCardProps {
  label: string;
  dimension: DimensionScore;
}

export function ScoreCard({ label, dimension }: ScoreCardProps) {
  return (
    <div className="text-center">
      <span className="meta block mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
        {label.toUpperCase()}
      </span>
      <span className="font-display text-[48px] font-normal leading-none block mb-4" style={{ color: 'var(--color-ink)' }}>
        {dimension.score}
      </span>
      <p className="font-body text-[12px] leading-relaxed mb-4" style={{ color: 'var(--color-ash)' }}>
        {dimension.narrative}
      </p>

      {/* Sub-metrics */}
      <div className="space-y-2">
        {Object.entries(dimension.subMetrics).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="meta flex-1 text-left" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
              {key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
            </span>
            <div className="w-12 h-px relative" style={{ backgroundColor: 'var(--color-fog)' }}>
              <div
                className="absolute top-0 left-0 h-px transition-all duration-1000"
                style={{ width: `${value}%`, backgroundColor: 'var(--color-ink)' }}
              />
            </div>
            <span className="meta w-5 text-right" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
