'use client';

interface GenerateBarProps {
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function GenerateBar({ canGenerate, isGenerating, onGenerate }: GenerateBarProps) {
  return (
    <div
      className={`sticky bottom-0 left-0 right-0 py-4 mt-9 transition-colors duration-[220ms] ${
        canGenerate ? 'border-t border-t-[var(--color-ink)]' : 'border-t border-t-[var(--color-fog)]'
      }`}
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      <div className="flex items-center justify-between max-w-[960px] mx-auto px-12 max-md:px-6">
        <div>
          {canGenerate ? (
            <span className="font-ui text-[10px] tracking-[0.12em] uppercase" style={{ color: 'var(--color-ink)' }}>
              Ready to generate
            </span>
          ) : (
            <span className="font-body text-[13px]" style={{ color: 'var(--color-ash)' }}>
              Add a brief or upload materials to continue
            </span>
          )}
        </div>
        <button
          className="font-ui text-[11px] tracking-[0.12em] uppercase py-[14px] px-9 bg-[var(--color-ink)] text-white border-none rounded-[2px] cursor-pointer transition-opacity duration-[220ms] min-w-[180px] disabled:opacity-30 disabled:cursor-default hover:not-disabled:opacity-[0.82]"
          disabled={!canGenerate || isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? 'Generating...' : 'Generate World'}
        </button>
      </div>
    </div>
  );
}
