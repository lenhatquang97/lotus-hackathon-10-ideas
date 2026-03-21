import type { BriefPreview } from '../../lib/brief-analyzer';
import { detectSceneType } from '../../lib/detectSceneType';
import { CatalogCard } from './CatalogCard';

function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {[100, 60, 80, 45, 70].map((w, i) => (
        <div key={i} className="h-3 animate-skeleton" style={{ width: `${w}%`, backgroundColor: 'var(--color-border)', borderRadius: '2px', animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

interface LivePreviewZoneProps {
  preview: BriefPreview;
  brief: string;
  activeTemplate: string | null;
}

export function LivePreviewZone({ preview, brief, activeTemplate }: LivePreviewZoneProps) {
  const sceneType = detectSceneType(brief, activeTemplate);

  return (
    <div style={{ background: 'rgba(10,10,10,0.025)' }}>
      {/* Zone label */}
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="font-ui text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>Preview</span>
        {preview.status === 'reading' && <span className="font-body text-xs animate-blink" style={{ color: 'var(--color-text-secondary)' }}>Reading...</span>}
        {(preview.status === 'ready' || preview.status === 'partial') && (
          <span className="font-body text-xs" style={{ color: 'var(--color-text-secondary)' }}>{preview.status === 'ready' ? 'Ready to generate' : 'Partial'}</span>
        )}
      </div>

      {preview.status === 'empty' && (
        <div className="flex items-center justify-center min-h-[200px] text-center">
          <p className="font-body text-sm leading-relaxed max-w-[200px]" style={{ color: 'var(--color-text-secondary)' }}>
            Start writing your brief or add knowledge materials — a preview will appear here.
          </p>
        </div>
      )}

      {preview.status === 'reading' && <PreviewSkeleton />}

      {(preview.status === 'partial' || preview.status === 'ready') && (
        <div className="animate-fade-up">
          <CatalogCard preview={preview} sceneType={sceneType} />
        </div>
      )}
    </div>
  );
}
