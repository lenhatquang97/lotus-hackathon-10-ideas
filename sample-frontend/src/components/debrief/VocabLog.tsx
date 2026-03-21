'use client';

interface VocabLogProps {
  used: string[];
  available: string[];
}

export function VocabLog({ used, available }: VocabLogProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
      <div className="p-5 bg-[var(--color-surface)]">
        <h4 className="meta mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Words You Used</h4>
        <div className="flex flex-wrap gap-1.5">
          {used.map((word, i) => (
            <span key={i} className="meta px-2 py-1 border border-[var(--color-fog)]" style={{ fontSize: '10px' }}>
              {word.toUpperCase()}
            </span>
          ))}
          {used.length === 0 && (
            <p className="font-body text-[12px]" style={{ color: 'var(--color-ash)' }}>No notable vocabulary detected</p>
          )}
        </div>
      </div>
      <div className="p-5 bg-[var(--color-surface)]">
        <h4 className="meta mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Words Available to You</h4>
        <p className="font-body text-[11px] mb-3" style={{ color: 'var(--color-ash)' }}>
          Try using these next time
        </p>
        <div className="flex flex-wrap gap-1.5">
          {available.map((word, i) => (
            <span
              key={i}
              className="px-2 py-1 border border-[var(--color-ink)]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-ink)',
              }}
            >
              {word}
            </span>
          ))}
          {available.length === 0 && (
            <p className="font-body text-[12px]" style={{ color: 'var(--color-ash)' }}>No suggestions</p>
          )}
        </div>
      </div>
    </div>
  );
}
