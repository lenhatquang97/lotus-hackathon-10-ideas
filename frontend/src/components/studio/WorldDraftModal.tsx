import { useEffect, useCallback } from 'react';
import type { Character } from '../../types';
import { DraftCharacterCard } from './DraftCharacterCard';

interface WorldDraft {
  title: string;
  description: string;
  domain_knowledge: string;
  difficulty_levels: string[];
  tags: string[];
  characters: Character[];
}

interface WorldDraftModalProps {
  draft: WorldDraft;
  onDraftChange: (draft: WorldDraft) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onDismiss: () => void;
}

export function WorldDraftModal({ draft, onDraftChange, onPublish, onSaveDraft, onDismiss }: WorldDraftModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape]);

  const handleCharacterChange = (index: number, updated: Character) => {
    const characters = [...draft.characters];
    characters[index] = updated;
    onDraftChange({ ...draft, characters });
  };

  return (
    <div className="fixed inset-0 flex items-end z-50 animate-scrim-in"
      style={{ background: 'rgba(247,246,244,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}>
      <div className="w-full flex flex-col animate-slide-up border-t"
        style={{ maxHeight: '88vh', backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-ink)' }}>
        {/* Header */}
        <div className="flex items-center justify-between py-5 px-12 shrink-0 border-b" style={{ borderColor: 'var(--color-fog)' }}>
          <span className="font-ui text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-ash)' }}>Generated World Draft</span>
          <button className="bg-transparent border-none font-body text-sm underline underline-offset-2 cursor-pointer transition-colors duration-200"
            style={{ color: 'var(--color-ash)' }} onClick={onDismiss}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ash)')}>
            Dismiss and revise
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-9 px-12 flex flex-col gap-12">
          {/* World metadata */}
          <div className="animate-stagger-1">
            <div className="flex items-baseline gap-3 mb-2">
              {draft.tags.map(t => (
                <span key={t} className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>{t.toUpperCase()}</span>
              ))}
            </div>
            <div className="h-px my-4" style={{ backgroundColor: 'var(--color-fog)' }} />
            <h2 className="font-display text-3xl font-semibold leading-tight mb-3" style={{ color: 'var(--color-ink)' }}>{draft.title}</h2>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{draft.description}</p>
          </div>

          {/* Background context */}
          {draft.domain_knowledge && (
            <div className="animate-stagger-2">
              <h3 className="font-display font-normal text-xl mb-4" style={{ color: 'var(--color-ink)' }}>Background Context</h3>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{draft.domain_knowledge}</p>
            </div>
          )}

          {/* Characters */}
          <div className="animate-stagger-3">
            <h3 className="font-display font-normal text-xl mb-4" style={{ color: 'var(--color-ink)' }}>Characters</h3>
            {draft.characters.map((char, i) => (
              <DraftCharacterCard key={char.id || i} character={char} index={i}
                onChange={(updated) => handleCharacterChange(i, updated)} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end py-5 px-12 shrink-0 border-t" style={{ borderColor: 'var(--color-fog)' }}>
          <button className="font-ui text-[10px] tracking-widest uppercase py-3 px-7 bg-transparent border cursor-pointer transition-all duration-200"
            style={{ color: 'var(--color-ink)', borderColor: 'var(--color-ink)', borderRadius: '2px' }}
            onClick={onSaveDraft}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-ink)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink)'; }}>
            Save as Draft
          </button>
          <button className="font-ui text-[10px] tracking-widest uppercase py-3 px-7 border-none cursor-pointer transition-opacity duration-200"
            style={{ backgroundColor: 'var(--color-ink)', color: 'white', borderRadius: '2px' }}
            onClick={onPublish}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.82')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
            Save &amp; Publish
          </button>
        </div>
      </div>
    </div>
  );
}

export type { WorldDraft };
