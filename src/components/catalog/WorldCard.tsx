'use client';

import Link from 'next/link';
import type { World } from '@/lib/types';

const domainLabels: Record<string, string> = {
  professional: 'Professional',
  social: 'Social',
  travel: 'Travel',
  academic: 'Academic',
  'daily-life': 'Daily Life',
};

const envLabels: Record<string, string> = {
  office: 'Office',
  cafe: 'Cafe',
  interview: 'Interview',
  apartment: 'Apartment',
};

export function WorldCard({ world }: { world: World }) {
  return (
    <Link href={`/world/${world.id}`} className="block group">
      <div
        className="h-full px-6 py-7 transition-all duration-220 cursor-pointer
          group-hover:bg-[var(--color-ink)] group-hover:text-white"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Top row: category + duration */}
        <div className="flex items-baseline justify-between">
          <span className="meta group-hover:text-white/70" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
            {domainLabels[world.domain] || world.domain}
          </span>
          <span className="meta group-hover:text-white/70" style={{ fontSize: '10px' }}>
            {world.duration} MIN
          </span>
        </div>

        {/* Divider */}
        <div
          className="my-3.5 h-px transition-colors duration-220
            group-hover:bg-white/15"
          style={{ backgroundColor: 'var(--color-fog)' }}
        />

        {/* Title */}
        <h3
          className="font-display text-[22px] font-semibold leading-[1.2] mb-2.5 transition-colors duration-220 group-hover:text-white"
          style={{ color: 'var(--color-ink)' }}
        >
          {world.title}
        </h3>

        {/* Description */}
        <p
          className="font-body text-[13px] leading-relaxed mb-5 line-clamp-3 transition-colors duration-220 group-hover:text-white/80"
          style={{ color: 'var(--color-ash)' }}
        >
          {world.description}
        </p>

        {/* Bottom row: location · agents | level badge */}
        <div className="flex items-center">
          <span className="meta transition-colors duration-220 group-hover:text-white/60" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
            {envLabels[world.environment]}
          </span>
          <span className="meta mx-2 transition-colors duration-220 group-hover:text-white/40" style={{ fontSize: '10px' }}>
            &middot;
          </span>
          <span className="meta transition-colors duration-220 group-hover:text-white/60" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
            {world.agents.length} {world.agents.length === 1 ? 'Agent' : 'Agents'}
          </span>
          <span
            className="meta ml-auto px-2 py-0.5 border transition-colors duration-220
              group-hover:text-white/70 group-hover:border-white/30"
            style={{
              fontSize: '10px',
              borderColor: 'var(--color-fog)',
              color: 'var(--color-ash)',
            }}
          >
            {world.cefrLevel}
          </span>
        </div>
      </div>
    </Link>
  );
}
