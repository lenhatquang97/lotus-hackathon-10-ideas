'use client';

import type { BriefPreview } from '@/lib/types';
import { detectSceneType } from '@/lib/detectSceneType';
import { CatalogCard } from './CatalogCard';

function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-[14px] pt-2">
      {[100, 60, 80, 45, 70].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded-[2px] animate-skeleton"
          style={{
            width: `${w}%`,
            backgroundColor: 'var(--color-fog)',
            animationDelay: `${i * 80}ms`,
          }}
        />
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
    <div className="preview-zone" style={{ background: 'rgba(10,10,10,0.025)' }}>
      {/* Zone label */}
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[var(--color-fog)]">
        <span className="font-ui text-[10px] tracking-[0.14em] uppercase" style={{ color: 'var(--color-ash)' }}>
          Preview
        </span>
        {preview.status === 'reading' && (
          <span className="font-body text-[12px] animate-blink" style={{ color: 'var(--color-ash)' }}>Reading...</span>
        )}
        {(preview.status === 'ready' || preview.status === 'partial') && (
          <span className="font-body text-[12px]" style={{ color: 'var(--color-ash)' }}>
            {preview.status === 'ready' ? 'Ready to generate' : 'Partial'}
          </span>
        )}
      </div>

      {preview.status === 'empty' && (
        <div className="flex items-center justify-center min-h-[200px] text-center">
          <p className="font-body text-[13px] leading-relaxed max-w-[200px]" style={{ color: 'var(--color-ash)' }}>
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
