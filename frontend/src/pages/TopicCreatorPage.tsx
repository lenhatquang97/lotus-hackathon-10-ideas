import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { topicsApi, generateApi } from '../services/api';
import { Navbar } from '../components/Navbar';
import { useDebounce } from '../hooks/useDebounce';
import { analyzeBrief } from '../lib/brief-analyzer';
import type { KnowledgeItem, Difficulty } from '../lib/brief-analyzer';
import type { Character } from '../types';
import { KnowledgeZone } from '../components/studio/KnowledgeZone';
import { BriefZone } from '../components/studio/BriefZone';
import { LivePreviewZone } from '../components/studio/LivePreviewZone';
import { GenerateBar } from '../components/studio/GenerateBar';
import { WorldDraftModal } from '../components/studio/WorldDraftModal';
import type { WorldDraft } from '../components/studio/WorldDraftModal';

const DIFFICULTY_MAP: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function TopicCreatorPage() {
  const navigate = useNavigate();

  const [brief, setBrief] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<WorldDraft | null>(null);
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
      const knowledgeTexts = knowledgeItems
        .filter((i) => i.content)
        .map((i) => i.content);

      const res = await generateApi.generateWorld({
        brief,
        difficulty,
        knowledge_items: knowledgeTexts.length > 0 ? knowledgeTexts : undefined,
      });

      const generated = res.data;

      // Map AI-generated characters to our Character type
      const characters: Character[] = (generated.characters || []).map((c: any, i: number) => ({
        id: `gen-${i}`,
        name: c.name || `Character ${i + 1}`,
        role: c.role || 'Anchor',
        persona: c.persona || '',
        bias_perception: c.bias_perception || '',
        voice_id: 'default',
        avatar_preset: 'default',
      }));

      const draft: WorldDraft = {
        title: generated.title || 'Untitled World',
        description: generated.description || brief.slice(0, 200),
        domain_knowledge: generated.domain_knowledge || brief,
        difficulty_levels: generated.difficulty_levels || [DIFFICULTY_MAP[difficulty]],
        tags: generated.tags || preview.detectedTopics.slice(0, 3),
        characters: characters.length > 0 ? characters : [
          { id: 'char-1', name: 'Character 1', role: 'Anchor', persona: '', bias_perception: '', voice_id: 'default', avatar_preset: 'default' },
        ],
      };

      setGeneratedDraft(draft);
      setShowModal(true);
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      setError(detail || 'Failed to generate world. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const saveWorld = async (publish: boolean) => {
    if (!generatedDraft) return;
    setError('');

    try {
      const res = await topicsApi.create({
        title: generatedDraft.title,
        description: generatedDraft.description,
        domain_knowledge: generatedDraft.domain_knowledge,
        difficulty_levels: generatedDraft.difficulty_levels,
        tags: generatedDraft.tags,
        characters: generatedDraft.characters.map(c => ({
          name: c.name, role: c.role, persona: c.persona,
          bias_perception: c.bias_perception, voice_id: c.voice_id, avatar_preset: c.avatar_preset,
        })),
      });

      if (publish) {
        await topicsApi.publish(res.data.id);
        navigate(`/topics/${res.data.id}`);
      } else {
        navigate('/studio');
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      {/* Page header */}
      <div className="max-w-[1120px] mx-auto w-full px-12 pt-12 pb-9 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Link to="/studio" className="font-ui text-[11px] tracking-widest uppercase block mb-5 no-underline transition-colors duration-200"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}>
          &larr; Studio
        </Link>
        <h1 className="font-display font-light text-5xl leading-none mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Create World
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Drop materials, describe your scenario, generate.
        </p>
      </div>

      {/* Composing Studio */}
      <div className="max-w-[1120px] mx-auto w-full px-12 py-12 flex-1 flex flex-col">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[280px_1fr_300px] gap-px border min-h-[520px]"
          style={{ backgroundColor: 'var(--color-border)', borderColor: 'var(--color-border)', borderRadius: '2px' }}>
          {/* Knowledge — left */}
          <div className="p-8 order-2 md:order-none" style={{ backgroundColor: 'var(--color-bg)' }}>
            <KnowledgeZone items={knowledgeItems} onAdd={(item) => setKnowledgeItems(prev => [...prev, item])} onRemove={(id) => setKnowledgeItems(prev => prev.filter(i => i.id !== id))} />
          </div>

          {/* Brief — center */}
          <div className="p-8 order-1 md:order-none" style={{ backgroundColor: 'var(--color-surface)' }}>
            <BriefZone value={brief} onChange={setBrief} difficulty={difficulty} onDifficultyChange={setDifficulty} onTemplateSelect={setActiveTemplate} />
          </div>

          {/* Preview — right */}
          <div className="p-8 order-3 md:order-none md:row-span-2 lg:row-span-1" style={{ backgroundColor: 'rgba(13, 11, 20, 0.025)' }}>
            <LivePreviewZone preview={preview} brief={brief} activeTemplate={activeTemplate} />
          </div>
        </div>

        {/* Error */}
        {error && <p className="font-body text-sm mt-4" style={{ color: 'var(--color-text-primary)' }}>{error}</p>}

        {/* Generate bar */}
        <GenerateBar canGenerate={canGenerate} isGenerating={generating} onGenerate={handleGenerate} />

        {/* Draft modal */}
        {showModal && generatedDraft && (
          <WorldDraftModal
            draft={generatedDraft}
            onDraftChange={setGeneratedDraft}
            onPublish={() => saveWorld(true)}
            onSaveDraft={() => saveWorld(false)}
            onDismiss={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
}
