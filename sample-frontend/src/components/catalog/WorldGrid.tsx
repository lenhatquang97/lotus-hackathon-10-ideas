'use client';

import { useState } from 'react';
import { useWorldStore } from '@/store/world-store';
import { WorldCard } from './WorldCard';
import type { CefrLevel, Domain } from '@/lib/types';

const domains: { value: Domain | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'professional', label: 'Professional' },
  { value: 'social', label: 'Social' },
  { value: 'travel', label: 'Travel' },
  { value: 'academic', label: 'Academic' },
  { value: 'daily-life', label: 'Daily Life' },
];

const levels: { value: CefrLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
];

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="meta relative px-3 py-1.5 transition-colors duration-150 cursor-pointer"
      style={{
        color: active ? 'var(--color-ink)' : 'var(--color-ash)',
        background: 'transparent',
        border: 'none',
      }}
    >
      {children}
      <span
        className="absolute bottom-0 left-3 right-3 transition-all duration-180"
        style={{
          height: '1.5px',
          backgroundColor: 'var(--color-ink)',
          transform: active ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
        }}
      />
    </button>
  );
}

export function WorldGrid() {
  const { worlds } = useWorldStore();
  const [domainFilter, setDomainFilter] = useState<Domain | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<CefrLevel | 'all'>('all');

  const filtered = worlds.filter(w => {
    if (domainFilter !== 'all' && w.domain !== domainFilter) return false;
    if (levelFilter !== 'all' && w.cefrLevel !== levelFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filter row — single line */}
      <div className="flex items-center mb-10 max-md:overflow-x-auto max-md:flex-nowrap max-md:pb-2">
        {/* Topic filters */}
        <div className="flex items-center">
          {domains.map(d => (
            <FilterButton key={d.value} active={domainFilter === d.value} onClick={() => setDomainFilter(d.value)}>
              {d.label}
            </FilterButton>
          ))}
        </div>

        {/* Vertical separator */}
        <div className="w-px h-4 mx-4 flex-shrink-0" style={{ backgroundColor: 'var(--color-fog)' }} />

        {/* Level filters */}
        <div className="flex items-center ml-auto">
          {levels.map(l => (
            <FilterButton key={l.value} active={levelFilter === l.value} onClick={() => setLevelFilter(l.value)}>
              {l.label}
            </FilterButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24" style={{ color: 'var(--color-ash)' }}>
          <p className="font-display text-xl mb-2">No worlds match your filters</p>
          <p className="font-body text-sm">Try adjusting your filters or create a new world</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: 'var(--color-paper)' }}>
          {filtered.map((world, i) => (
            <div
              key={world.id}
              className="animate-fade-up"
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
            >
              <WorldCard world={world} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
