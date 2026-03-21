interface GenerateBarProps {
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function GenerateBar({ canGenerate, isGenerating, onGenerate }: GenerateBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 py-4 mt-9 transition-colors duration-200 border-t"
      style={{ backgroundColor: 'var(--color-paper)', borderColor: canGenerate ? 'var(--color-ink)' : 'var(--color-fog)' }}>
      <div className="flex items-center justify-between max-w-[1120px] mx-auto px-12">
        <div>
          {canGenerate ? (
            <span className="font-ui text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-ink)' }}>Ready to generate</span>
          ) : (
            <span className="font-body text-sm" style={{ color: 'var(--color-ash)' }}>Add a brief or upload materials to continue</span>
          )}
        </div>
        <button
          className="font-ui text-[11px] tracking-widest uppercase py-3.5 px-9 border-none cursor-pointer transition-opacity duration-200"
          style={{
            backgroundColor: 'var(--color-ink)', color: 'white', borderRadius: '2px',
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
