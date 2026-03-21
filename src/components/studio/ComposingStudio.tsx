'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/store/world-store';
import { useDebounce } from '@/hooks/use-debounce';
import { analyzeBrief } from '@/lib/brief-analyzer';
import type { KnowledgeItem, Difficulty, World } from '@/lib/types';
import { KnowledgeZone } from './KnowledgeZone';
import { BriefZone } from './BriefZone';
import { LivePreviewZone } from './LivePreviewZone';
import { GenerateBar } from './GenerateBar';
import { WorldDraftModal } from './WorldDraftModal';

export function ComposingStudio() {
  const router = useRouter();
  const { addWorld } = useWorldStore();

  const [brief, setBrief] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<World | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Debounced brief for live preview
  const debouncedBrief = useDebounce(brief, 800);
  const preview = useMemo(
    () => analyzeBrief(debouncedBrief, knowledgeItems),
    [debouncedBrief, knowledgeItems]
  );

  const canGenerate = brief.trim().length > 20 || knowledgeItems.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError('');

    try {
      // Build prompt from brief + knowledge items
      let prompt = brief;
      const textItems = knowledgeItems.filter((i) => i.content);
      if (textItems.length > 0) {
        prompt += '\n\nAdditional context:\n' + textItems.map((i) => `- ${i.content}`).join('\n');
      }

      const res = await fetch('/api/generate-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, difficulty }),
      });

      if (!res.ok) throw new Error('Failed to generate world');
      const world: World = await res.json();
      setGeneratedDraft(world);
      setShowModal(true);
    } catch {
      setError('Failed to generate world. Check your API key and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!generatedDraft) return;
    addWorld(generatedDraft);
    router.push('/');
  };

  const handleSaveDraft = () => {
    if (!generatedDraft) return;
    addWorld(generatedDraft);
    router.push('/');
  };

  const handleAddKnowledge = (item: KnowledgeItem) => {
    setKnowledgeItems((prev) => [...prev, item]);
  };

  const handleRemoveKnowledge = (id: string) => {
    setKnowledgeItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="max-w-[1120px] mx-auto px-12 max-md:px-6 py-12 flex-1 flex flex-col">
      {/* 3-column grid */}
      <div
        className="grid grid-cols-[280px_1fr_300px] max-lg:grid-cols-[1fr_280px] max-md:grid-cols-1 gap-px border rounded-[2px] min-h-[520px]"
        style={{ backgroundColor: 'var(--color-fog)', borderColor: 'var(--color-fog)' }}
      >
        {/* Knowledge — left */}
        <div className="p-8 max-md:order-2" style={{ backgroundColor: 'var(--color-paper)' }}>
          <KnowledgeZone items={knowledgeItems} onAdd={handleAddKnowledge} onRemove={handleRemoveKnowledge} />
        </div>

        {/* Brief — center */}
        <div className="p-8 max-lg:col-span-1 max-lg:row-span-1 max-md:order-1" style={{ backgroundColor: 'var(--color-surface)' }}>
          <BriefZone value={brief} onChange={setBrief} difficulty={difficulty} onDifficultyChange={setDifficulty} onTemplateSelect={setActiveTemplate} />
        </div>

        {/* Preview — right */}
        <div className="p-8 max-lg:row-span-2 max-md:row-span-1 max-md:order-3" style={{ backgroundColor: 'rgba(10,10,10,0.025)' }}>
          <LivePreviewZone preview={preview} brief={brief} activeTemplate={activeTemplate} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="font-body text-[13px] mt-4" style={{ color: 'var(--color-ink)' }}>
          {error}
        </p>
      )}

      {/* Generate bar */}
      <GenerateBar canGenerate={canGenerate} isGenerating={generating} onGenerate={handleGenerate} />

      {/* Draft modal */}
      {showModal && generatedDraft && (
        <WorldDraftModal
          draft={generatedDraft}
          onDraftChange={setGeneratedDraft}
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
          onDismiss={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
