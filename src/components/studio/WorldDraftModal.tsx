'use client';

import { useEffect, useCallback } from 'react';
import type { World, AgentPersona } from '@/lib/types';
import { DraftCharacterCard } from './DraftCharacterCard';

interface WorldDraftModalProps {
  draft: World;
  onDraftChange: (draft: World) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onDismiss: () => void;
}

export function WorldDraftModal({ draft, onDraftChange, onPublish, onSaveDraft, onDismiss }: WorldDraftModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    },
    [onDismiss]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape]);

  const handleCharacterChange = (index: number, updated: AgentPersona) => {
    const agents = [...draft.agents];
    agents[index] = updated;
    onDraftChange({ ...draft, agents });
  };

  return (
    <div
      className="fixed inset-0 flex items-end z-[200] animate-scrim-in"
      style={{ background: 'rgba(247,246,244,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        className="w-full max-h-[88vh] flex flex-col animate-slide-up border-t"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-ink)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between py-5 px-12 max-md:px-6 shrink-0 border-b"
          style={{ borderColor: 'var(--color-fog)' }}
        >
          <span className="font-ui text-[10px] tracking-[0.14em] uppercase" style={{ color: 'var(--color-ash)' }}>
            Generated World Draft
          </span>
          <button
            className="bg-transparent border-none font-body text-[13px] underline underline-offset-[3px] cursor-pointer transition-colors duration-[220ms] hover:text-[var(--color-ink)]"
            style={{ color: 'var(--color-ash)' }}
            onClick={onDismiss}
          >
            Dismiss and revise
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-9 px-12 max-md:px-6 flex flex-col gap-12">
          {/* World metadata */}
          <div className="animate-stagger-1">
            <div className="flex items-baseline justify-between mb-2">
              <span className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
                {draft.domain.toUpperCase()}
              </span>
              <span className="meta" style={{ fontSize: '10px' }}>
                {draft.cefrLevel} &middot; {draft.duration} MIN
              </span>
            </div>
            <div className="h-px my-4" style={{ backgroundColor: 'var(--color-fog)' }} />
            <h2 className="font-display text-[28px] font-semibold leading-[1.2] mb-3" style={{ color: 'var(--color-ink)' }}>
              {draft.title}
            </h2>
            <p className="font-body text-[14px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              {draft.description}
            </p>
          </div>

          {/* Scenario */}
          <div className="animate-stagger-2">
            <h3 className="font-display font-normal text-[22px] mb-4" style={{ color: 'var(--color-ink)' }}>
              Scenario
            </h3>
            <p className="font-body text-[14px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              {draft.scenarioContext}
            </p>
          </div>

          {/* Conversation Arc */}
          <div className="animate-stagger-3">
            <h3 className="font-display font-normal text-[22px] mb-4" style={{ color: 'var(--color-ink)' }}>
              Conversation Arc
            </h3>
            <ol className="space-y-[6px]">
              {draft.conversationBeats.map((beat, i) => (
                <li key={i} className="font-body text-[13px] flex gap-2" style={{ color: 'var(--color-ash)' }}>
                  <span className="meta shrink-0" style={{ fontSize: '10px', marginTop: '2px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {beat}
                </li>
              ))}
            </ol>
          </div>

          {/* Characters */}
          <div className="animate-stagger-4">
            <h3 className="font-display font-normal text-[22px] mb-4" style={{ color: 'var(--color-ink)' }}>
              Characters
            </h3>
            {draft.agents.map((agent, i) => (
              <DraftCharacterCard
                key={agent.id}
                character={agent}
                index={i}
                onChange={(updated) => handleCharacterChange(i, updated)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 justify-end py-5 px-12 max-md:px-6 shrink-0 border-t"
          style={{ borderColor: 'var(--color-fog)' }}
        >
          <button
            className="font-ui text-[10px] tracking-[0.12em] uppercase py-3 px-7 bg-transparent border rounded-[2px] cursor-pointer transition-all duration-[220ms] hover:bg-[var(--color-ink)] hover:text-white"
            style={{ color: 'var(--color-ink)', borderColor: 'var(--color-ink)' }}
            onClick={onSaveDraft}
          >
            Save as Draft
          </button>
          <button
            className="font-ui text-[10px] tracking-[0.12em] uppercase py-3 px-7 bg-[var(--color-ink)] text-white border-none rounded-[2px] cursor-pointer transition-opacity duration-[220ms] hover:opacity-[0.82]"
            onClick={onPublish}
          >
            Save &amp; Publish
          </button>
        </div>
      </div>
    </div>
  );
}
