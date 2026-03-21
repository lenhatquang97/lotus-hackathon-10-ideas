interface GenerateBarProps {
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function GenerateBar({ canGenerate, isGenerating, onGenerate }: GenerateBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 py-4 mt-9 transition-colors duration-200 border-t"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: canGenerate ? 'var(--color-accent-border)' : 'var(--color-border)' }}>
      <div className="flex items-center justify-between max-w-[1120px] mx-auto px-12">
        <div>
          {canGenerate ? (
            <span className="font-ui text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-text-primary)' }}>Ready to generate</span>
          ) : (
            <span className="font-body text-sm" style={{ color: 'var(--color-text-secondary)' }}>Add a brief or upload materials to continue</span>
          )}
        </div>
        <button
          className="font-ui text-[11px] tracking-widest uppercase py-3.5 px-9 border-none cursor-pointer transition-opacity duration-200"
          style={{
            backgroundColor: 'var(--color-accent)', color: '#0D0B14', borderRadius: '2px',
            minWidth: '180px', opacity: (!canGenerate || isGenerating) ? 0.3 : 1,
            cursor: (!canGenerate || isGenerating) ? 'default' : 'pointer',
          }}
          disabled={!canGenerate || isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? 'Generating...' : 'Generate World'}
        </button>
      </div>
    </div>
  );
}
