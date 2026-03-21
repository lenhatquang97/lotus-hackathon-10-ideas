'use client';

import type { BriefPreview } from '@/lib/types';
import type { SceneType } from '@/lib/detectSceneType';
import { SceneIllustration } from './SceneIllustration';

interface CatalogCardProps {
  preview: BriefPreview;
  sceneType: SceneType | null;
}

function getConfidenceHint(score: number): string {
  if (score >= 80) return 'Strong brief — ready to generate.';
  if (score >= 50) return 'Good start. Adding more detail improves character depth.';
  if (score >= 20) return 'Brief is sparse — generation will fill gaps with defaults.';
  return 'Add a description or upload materials to improve quality.';
}

export function CatalogCard({ preview, sceneType }: CatalogCardProps) {
  return (
    <div className="catalog-card-wrap">

      <div className="catalog-card">
        <div className="card-scene">
          {sceneType ? (
            <SceneIllustration type={sceneType} />
          ) : (
            <div className="card-scene-empty" />
          )}
          <div className="card-difficulty-stripe">
            <span className="card-difficulty-text">
              {preview.suggestedDifficulty || 'intermediate'}
            </span>
          </div>
        </div>

        <div className="card-body">
          <div className="card-meta-row">
            <span className="card-agent-count">{preview.suggestedCharacterCount} AGENTS</span>
            {preview.estimatedDurationMin > 0 && (
              <span className="card-duration">~{preview.estimatedDurationMin} MIN</span>
            )}
          </div>

          <h2 className="card-title">
            {preview.suggestedTitle || <span className="card-title-skeleton" />}
          </h2>

          {preview.setting && (
            <div className="card-setting-chip">{preview.setting.toUpperCase()}</div>
          )}

          <p className="card-scenario">
            {preview.scenarioSummary || preview.scenario?.slice(0, 140)}
          </p>

          <div className="card-divider" />

          <div className="card-tags">
            {preview.detectedTopics.slice(0, 3).map(t => (
              <span key={t} className="card-tag">{t}</span>
            ))}
          </div>

          {preview.suggestedAgentNames.length > 0 && (
            <div className="card-agent-row">
              {preview.suggestedAgentNames.map((_, i) => (
                <div key={i} className="agent-avatar-stub" />
              ))}
              <span className="agent-names-text">
                {preview.suggestedAgentNames.join(' · ')}
              </span>
            </div>
          )}
        </div>

        <div className="card-catalog-label">AS IT APPEARS IN CATALOG</div>
      </div>

      {preview.vocabularyHints.length > 0 && (
        <div className="preview-below-section">
          <span className="preview-below-label">KEY VOCABULARY</span>
          <div className="vocab-pills">
            {preview.vocabularyHints.map(v => (
              <span key={v} className="vocab-pill">{v}</span>
            ))}
          </div>
        </div>
      )}

      <div className="preview-below-section">
        <span className="preview-below-label">CONFIDENCE</span>
        <div className="confidence-track">
          <div className="confidence-fill" style={{ width: `${preview.confidence ?? 0}%` }} />
        </div>
        <p className="confidence-hint">{getConfidenceHint(preview.confidence ?? 0)}</p>
      </div>
    </div>
  );
}
