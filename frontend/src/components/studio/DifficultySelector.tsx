import type { Difficulty } from '../../lib/brief-analyzer';

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
          className="font-ui text-[10px] tracking-widest uppercase px-3 py-1 bg-transparent border-none cursor-pointer transition-all duration-200"
          style={{
            color: value === opt ? 'var(--color-ink)' : 'var(--color-ash)',
            borderBottom: value === opt ? '2px solid var(--color-ink)' : '2px solid transparent',
            paddingBottom: value === opt ? '3px' : '5px',
          }}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
