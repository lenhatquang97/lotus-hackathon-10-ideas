'use client';

import type { Difficulty } from '@/lib/types';

const OPTIONS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          className={`font-ui text-[10px] tracking-[0.10em] uppercase px-3 py-[5px] bg-transparent border-none cursor-pointer transition-all duration-[220ms] relative ${
            value === opt
              ? 'text-[var(--color-ink)] border-b-2 border-b-[var(--color-ink)] pb-[3px]'
              : 'text-[var(--color-ash)] border-b-2 border-b-transparent hover:text-[var(--color-ink)]'
          }`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
