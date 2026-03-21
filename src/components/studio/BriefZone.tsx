'use client';

import { useState } from 'react';
import type { Difficulty } from '@/lib/types';
import { DifficultySelector } from './DifficultySelector';

const PLACEHOLDER = `Describe the world you want to create...

For example: "A salary negotiation between a project manager and an HR director at a Singapore tech startup. The company is tightening budgets after a slow Q3, but the manager has clearly outperformed. The HR director is professional but non-committal."

Or simply: "Job interview at a British law firm. The interviewer is formal and challenging."`;

const QUICK_TEMPLATES = [
  { label: 'Salary negotiation', text: 'Office. Employee asking their manager for a salary raise after delivering strong results. Manager is cautious — company is mid-cycle.' },
  { label: 'Airport check-in', text: 'International airport. Passenger at check-in desk — bag is overweight, flight is in 2 hours. Agent is helpful but procedural.' },
  { label: 'Job interview', text: 'Formal job interview at a consulting firm. Two interviewers — one technical, one behavioral. Candidate is strong but nervous.' },
  { label: 'Client complaint', text: 'Customer service desk. Client is frustrated about a delayed order. Representative must de-escalate and find a resolution.' },
  { label: 'Team disagreement', text: 'Weekly team meeting. Disagreement about project direction — one senior member pushes back on the plan. Others are watching.' },
];

interface BriefZoneProps {
  value: string;
  onChange: (v: string) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onTemplateSelect?: (label: string) => void;
}

export function BriefZone({ value, onChange, difficulty, onDifficultyChange, onTemplateSelect }: BriefZoneProps) {
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleTemplate = (text: string) => {
    if (value.trim()) {
      onChange(value + '\n\n' + text);
      setCharCount((value + '\n\n' + text).length);
    } else {
      onChange(text);
      setCharCount(text.length);
    }
  };

  return (
    <div className="brief-zone" style={{ background: 'var(--color-surface)' }}>
      {/* Zone label */}
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[var(--color-fog)]">
        <span className="font-ui text-[10px] tracking-[0.14em] uppercase" style={{ color: 'var(--color-ash)' }}>
          World Brief
        </span>
        <span className="font-body text-[12px]" style={{ color: 'var(--color-ash)' }}>
          Natural language
        </span>
      </div>

      {/* Quick templates */}
      <div className="flex flex-wrap gap-[6px] mb-5">
        {QUICK_TEMPLATES.map((t) => (
          <button
            key={t.label}
            className="font-ui text-[9px] tracking-[0.10em] uppercase bg-transparent border border-[var(--color-fog)] rounded-[2px] py-[5px] px-[10px] cursor-pointer transition-all duration-[220ms] whitespace-nowrap hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            style={{ color: 'var(--color-ash)' }}
            onClick={() => { handleTemplate(t.text); onTemplateSelect?.(t.label); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main textarea */}
      <div className="relative flex-1">
        <textarea
          className="w-full min-h-[320px] font-body text-[15px] leading-[1.7] bg-transparent border-0 border-b border-b-[var(--color-fog)] rounded-none p-0 pb-4 resize-none outline-none transition-colors duration-[220ms] focus:border-b-[var(--color-ash)]"
          style={{ color: 'var(--color-ink)' }}
          placeholder={PLACEHOLDER}
          value={value}
          onChange={handleChange}
          maxLength={2000}
        />
        {charCount > 0 && (
          <span
            className="absolute bottom-5 right-0 font-ui text-[10px] tracking-[0.06em]"
            style={{ color: 'var(--color-ash)' }}
          >
            {charCount} / 2000
          </span>
        )}
      </div>

      {/* Difficulty */}
      <div className="flex items-center gap-5 mt-6 pt-4 border-t border-[var(--color-fog)]">
        <span className="font-ui text-[10px] tracking-[0.12em] uppercase shrink-0" style={{ color: 'var(--color-ash)' }}>
          Difficulty
        </span>
        <DifficultySelector value={difficulty} onChange={onDifficultyChange} />
      </div>
    </div>
  );
}
