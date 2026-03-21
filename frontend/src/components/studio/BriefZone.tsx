import { useState } from 'react';
import type { Difficulty } from '../../lib/brief-analyzer';
import { DifficultySelector } from './DifficultySelector';

const PLACEHOLDER = `Describe the world you want to create...

For example: "A salary negotiation between a project manager and an HR director at a Singapore tech startup. The company is tightening budgets after a slow Q3, but the manager has clearly outperformed."

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
      const newVal = value + '\n\n' + text;
      onChange(newVal);
      setCharCount(newVal.length);
    } else {
      onChange(text);
      setCharCount(text.length);
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)' }}>
      {/* Zone label */}
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="font-ui text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>World Brief</span>
        <span className="font-body text-xs" style={{ color: 'var(--color-text-secondary)' }}>Natural language</span>
      </div>

      {/* Quick templates */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {QUICK_TEMPLATES.map((t) => (
          <button key={t.label}
            className="font-ui text-[9px] tracking-widest uppercase bg-transparent border py-1 px-2.5 cursor-pointer transition-all duration-200 whitespace-nowrap"
            style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', borderRadius: '2px' }}
            onClick={() => { handleTemplate(t.text); onTemplateSelect?.(t.label); }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >{t.label}</button>
        ))}
      </div>

      {/* Main textarea */}
      <div className="relative flex-1">
        <textarea
          className="w-full font-body text-base leading-relaxed bg-transparent border-0 border-b p-0 pb-4 resize-none outline-none transition-colors duration-200"
          style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)', minHeight: '320px' }}
          placeholder={PLACEHOLDER}
          value={value} onChange={handleChange} maxLength={2000}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-text-secondary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
        />
        {charCount > 0 && (
          <span className="absolute bottom-5 right-0 font-ui text-[10px] tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
            {charCount} / 2000
          </span>
        )}
      </div>

      {/* Difficulty */}
      <div className="flex items-center gap-5 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <span className="font-ui text-[10px] tracking-widest uppercase shrink-0" style={{ color: 'var(--color-text-secondary)' }}>Difficulty</span>
        <DifficultySelector value={difficulty} onChange={onDifficultyChange} />
      </div>
    </div>
  );
}
