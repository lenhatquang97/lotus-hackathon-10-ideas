import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { topicsApi } from '../services/api';
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
      // Build a description from brief + knowledge
      let fullBrief = brief;
      const textItems = knowledgeItems.filter((i) => i.content);
      if (textItems.length > 0) {
        fullBrief += '\n\nAdditional context:\n' + textItems.map((i) => `- ${i.content}`).join('\n');
      }

      // Extract meaningful data from the brief for the draft
      const firstSentence = brief.split(/[.!?\n]/)[0].trim();
      const title = firstSentence.length > 60 ? firstSentence.slice(0, 60) + '...' : firstSentence || 'Untitled World';

      // Generate characters from the brief
      const characters: Character[] = [
        { id: 'char-1', name: 'Character 1', role: 'Primary', persona: 'Define the personality and communication style of this character.', bias_perception: '', voice_id: 'default', avatar_preset: 'default' },
        { id: 'char-2', name: 'Character 2', role: 'Secondary', persona: 'Define the personality and communication style of this character.', bias_perception: '', voice_id: 'default', avatar_preset: 'default' },
      ];

      const draft: WorldDraft = {
        title,
        description: brief.slice(0, 200),
        domain_knowledge: fullBrief,
        difficulty_levels: [DIFFICULTY_MAP[difficulty]],
        tags: preview.detectedTopics.slice(0, 3),
        characters,
      };

      setGeneratedDraft(draft);
      setShowModal(true);
    } catch {
      setError('Failed to generate world. Please try again.');
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
        navigate('/topics');
      } else {
        navigate('/studio');
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />

      {/* Page header */}
      <div className="max-w-[1120px] mx-auto w-full px-12 pt-12 pb-9 border-b" style={{ borderColor: 'var(--color-fog)' }}>
        <Link to="/studio" className="font-ui text-[11px] tracking-widest uppercase block mb-5 no-underline transition-colors duration-200"
          style={{ color: 'var(--color-ash)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ash)')}>
          &larr; Studio
        </Link>
        <h1 className="font-display font-light text-5xl leading-none mb-2" style={{ color: 'var(--color-ink)' }}>
          Create World
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--color-ash)' }}>
          Drop materials, describe your scenario, generate.
        </p>
      </div>

      {/* Composing Studio */}
      <div className="max-w-[1120px] mx-auto w-full px-12 py-12 flex-1 flex flex-col">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[280px_1fr_300px] gap-px border min-h-[520px]"
          style={{ backgroundColor: 'var(--color-fog)', borderColor: 'var(--color-fog)', borderRadius: '2px' }}>
          {/* Knowledge — left */}
          <div className="p-8 order-2 md:order-none" style={{ backgroundColor: 'var(--color-paper)' }}>
            <KnowledgeZone items={knowledgeItems} onAdd={(item) => setKnowledgeItems(prev => [...prev, item])} onRemove={(id) => setKnowledgeItems(prev => prev.filter(i => i.id !== id))} />
          </div>

          {/* Brief — center */}
          <div className="p-8 order-1 md:order-none" style={{ backgroundColor: 'var(--color-surface)' }}>
            <BriefZone value={brief} onChange={setBrief} difficulty={difficulty} onDifficultyChange={setDifficulty} onTemplateSelect={setActiveTemplate} />
          </div>

          {/* Preview — right */}
          <div className="p-8 order-3 md:order-none md:row-span-2 lg:row-span-1" style={{ backgroundColor: 'rgba(10,10,10,0.025)' }}>
            <LivePreviewZone preview={preview} brief={brief} activeTemplate={activeTemplate} />
          </div>
        </div>

        {/* Error */}
        {error && <p className="font-body text-sm mt-4" style={{ color: 'var(--color-ink)' }}>{error}</p>}

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
