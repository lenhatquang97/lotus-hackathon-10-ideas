import { useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { topicsApi, generateApi, studioApi } from '../services/api';
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

// ─── Constants ───────────────────────────────────────────────────────────────

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DIFFICULTY_MAP: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel', gender: 'F', style: 'Calm' },
  { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi',   gender: 'F', style: 'Strong' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella',  gender: 'F', style: 'Soft' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli',   gender: 'F', style: 'Warm' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni', gender: 'M', style: 'Smooth' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh',   gender: 'M', style: 'Deep' },
  { id: 'VR6AewLTigWG4xSOukaG', label: 'Arnold', gender: 'M', style: 'Crisp' },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam',   gender: 'M', style: 'Authoritative' },
  { id: 'default',               label: 'Default', gender: '–', style: 'Neutral' },
];

const AVATAR_PRESETS = [
  { id: 'avatar_a', color: '#4a90d9', label: 'Blue' },
  { id: 'avatar_b', color: '#d94a4a', label: 'Red' },
  { id: 'avatar_c', color: '#4ad97e', label: 'Green' },
  { id: 'avatar_d', color: '#d9a84a', label: 'Amber' },
  { id: 'avatar_e', color: '#a94ad9', label: 'Purple' },
  { id: 'avatar_f', color: '#4ad9d9', label: 'Teal' },
];

// Mock visual presets — placeholder silhouettes until 3D models are ready
const VISUAL_PRESETS: {
  id: string;
  label: string;
  style: string;
  // simple SVG path data for a character silhouette
  silhouette: 'formal' | 'casual' | 'academic' | 'creative' | 'medical' | 'tech';
}[] = [
  { id: 'vis_formal',   label: 'Formal',   style: 'Business suit, authoritative',   silhouette: 'formal'   },
  { id: 'vis_casual',   label: 'Casual',   style: 'Relaxed, approachable',          silhouette: 'casual'   },
  { id: 'vis_academic', label: 'Academic', style: 'Scholarly, glasses',             silhouette: 'academic' },
  { id: 'vis_creative', label: 'Creative', style: 'Artistic, expressive',           silhouette: 'creative' },
  { id: 'vis_medical',  label: 'Medical',  style: 'Clinical, white coat',           silhouette: 'medical'  },
  { id: 'vis_tech',     label: 'Tech',     style: 'Hoodie, casual-professional',    silhouette: 'tech'     },
];

// Silhouette SVG components (mock illustrations)
function CharacterSilhouette({ type, color }: { type: typeof VISUAL_PRESETS[0]['silhouette']; color: string }) {
  const fill = color;
  const dim = 'rgba(0,0,0,0.18)';

  const heads: Record<typeof type, React.ReactNode> = {
    formal: (
      <g>
        {/* head */}
        <ellipse cx="40" cy="22" rx="13" ry="15" fill={fill} />
        {/* suit body */}
        <rect x="20" y="40" width="40" height="36" rx="2" fill={fill} />
        {/* lapels */}
        <polygon points="40,42 28,58 40,54" fill={dim} />
        <polygon points="40,42 52,58 40,54" fill={dim} />
        {/* tie */}
        <polygon points="40,44 37,68 40,72 43,68" fill={dim} />
      </g>
    ),
    casual: (
      <g>
        <ellipse cx="40" cy="22" rx="13" ry="15" fill={fill} />
        {/* t-shirt */}
        <path d="M22 40 Q30 37 40 40 Q50 37 58 40 L60 76 L20 76 Z" fill={fill} />
        {/* collar */}
        <path d="M33 40 Q40 48 47 40" fill="none" stroke={dim} strokeWidth="2.5" />
      </g>
    ),
    academic: (
      <g>
        <ellipse cx="40" cy="22" rx="13" ry="15" fill={fill} />
        {/* glasses */}
        <circle cx="35" cy="21" r="5" fill="none" stroke={dim} strokeWidth="2" />
        <circle cx="45" cy="21" r="5" fill="none" stroke={dim} strokeWidth="2" />
        <line x1="40" y1="21" x2="40" y2="21" stroke={dim} strokeWidth="2" />
        {/* blazer */}
        <rect x="21" y="40" width="38" height="36" rx="2" fill={fill} />
        <polygon points="40,42 27,56 38,52" fill={dim} />
        <polygon points="40,42 53,56 42,52" fill={dim} />
      </g>
    ),
    creative: (
      <g>
        <ellipse cx="40" cy="21" rx="13" ry="15" fill={fill} />
        {/* wild hair */}
        <ellipse cx="40" cy="11" rx="16" ry="8" fill={dim} />
        {/* casual top with scarf */}
        <rect x="22" y="40" width="36" height="36" rx="3" fill={fill} />
        <path d="M30 42 Q40 52 50 42 Q48 60 40 64 Q32 60 30 42Z" fill={dim} />
      </g>
    ),
    medical: (
      <g>
        <ellipse cx="40" cy="22" rx="13" ry="15" fill={fill} />
        {/* white coat outline */}
        <rect x="19" y="40" width="42" height="36" rx="2" fill={fill} />
        <line x1="40" y1="44" x2="40" y2="76" stroke={dim} strokeWidth="2" />
        {/* stethoscope */}
        <path d="M28 50 Q24 60 28 66" fill="none" stroke={dim} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="68" r="3" fill={dim} />
        {/* pocket */}
        <rect x="44" y="50" width="10" height="7" rx="1" fill={dim} />
      </g>
    ),
    tech: (
      <g>
        <ellipse cx="40" cy="22" rx="13" ry="15" fill={fill} />
        {/* hoodie */}
        <path d="M20 42 Q30 38 40 42 Q50 38 60 42 L62 76 L18 76 Z" fill={fill} />
        {/* hood */}
        <path d="M27 42 Q40 30 53 42" fill="none" stroke={dim} strokeWidth="3" strokeLinecap="round" />
        {/* kangaroo pocket */}
        <rect x="28" y="60" width="24" height="10" rx="2" fill={dim} />
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {heads[type]}
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CharacterDraft {
  name: string;
  role: string;
  persona: string;
  bias_perception: string;
  voice_id: string;
  avatar_preset: string;
  visual_preset: string;
}

interface ConversationTurn {
  speaker: string;
  text: string;
}

type Step = 'setup' | 'characters' | 'conversation' | 'publish';

const STEPS: { key: Step; label: string; index: number }[] = [
  { key: 'setup',        label: 'Setup',        index: 1 },
  { key: 'characters',   label: 'Characters',   index: 2 },
  { key: 'conversation', label: 'Sample Convo', index: 3 },
  { key: 'publish',      label: 'Publish',      index: 4 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.find(s => s.key === current)!.index;
  return (
    <div className="flex items-center gap-0 mb-12">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex items-center gap-2">
            <span
              className="meta"
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: step.index <= currentIndex ? 'var(--color-ink)' : 'var(--color-fog)',
                fontWeight: step.index === currentIndex ? '600' : '400',
              }}
            >
              {String(step.index).padStart(2, '0')} {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span className="mx-4 meta" style={{ fontSize: '10px', color: 'var(--color-fog)' }}>—</span>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <label className="meta block" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>{children}</label>
      {hint && <p className="font-body text-[12px] mt-1" style={{ color: 'var(--color-ash)' }}>{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 border font-body text-[14px] outline-none"
      style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 border font-body text-[14px] outline-none resize-none"
      style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
    />
  );
}

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
  );
}

// ─── Step 1: Setup ────────────────────────────────────────────────────────────

function StepSetup({
  title, setTitle,
  description, setDescription,
  domainKnowledge, setDomainKnowledge,
  tags, setTags,
  cefrLevels, setCefrLevels,
  numCharacters, setNumCharacters,
  generating, onGenerate, error,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  domainKnowledge: string; setDomainKnowledge: (v: string) => void;
  tags: string; setTags: (v: string) => void;
  cefrLevels: string[]; setCefrLevels: (v: string[]) => void;
  numCharacters: number; setNumCharacters: (v: number) => void;
  generating: boolean; onGenerate: () => void; error: string;
}) {
  const toggleCefr = (l: string) =>
    setCefrLevels(cefrLevels.includes(l) ? cefrLevels.filter(x => x !== l) : [...cefrLevels, l]);

  const canGenerate = title.trim() && domainKnowledge.trim();

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    setUploadMsg('');
    try {
      const res = await studioApi.extractText(file);
      const { text, characters, truncated, filename } = res.data;
      // Append extracted text to existing context (with separator if needed)
      setDomainKnowledge(
        domainKnowledge.trim()
          ? `${domainKnowledge.trim()}\n\n---\n${text}`
          : text,
      );
      setUploadState('done');
      setUploadMsg(
        `${filename} — ${characters.toLocaleString()} chars extracted${truncated ? ' (truncated to 20 000)' : ''}`,
      );
    } catch (err: any) {
      setUploadState('error');
      setUploadMsg(err.response?.data?.detail || 'File extraction failed.');
    } finally {
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <FieldLabel>World Title *</FieldLabel>
        <TextInput value={title} onChange={setTitle} placeholder="e.g. Negotiating a Salary Raise" />
      </div>

      <div>
        <FieldLabel hint="Brief summary shown in the catalog">Short Description</FieldLabel>
        <TextArea value={description} onChange={setDescription} rows={2} placeholder="What will learners practice in this world?" />
      </div>

      <div>
        <div className="flex items-end justify-between mb-2">
          <div className="flex-1">
            <FieldLabel hint="Shared facts all characters know — scenario constraints, key figures, relevant data">
              Background Context *
            </FieldLabel>
          </div>
          {/* File upload button */}
          <div className="flex items-center gap-3 mb-2 ml-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === 'uploading'}
              className="meta flex items-center gap-1.5 px-3 py-1.5 border transition-all disabled:opacity-50"
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                borderColor: 'var(--color-fog)',
                color: 'var(--color-ash)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {uploadState === 'uploading' ? (
                <><Spinner /> Extracting…</>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M8 1v10M4 5l4-4 4 4M2 13h12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Import file
                </>
              )}
            </button>
            <span className="meta" style={{ fontSize: '9px', color: 'var(--color-ash)' }}>PDF · DOCX · TXT</span>
          </div>
        </div>

        <TextArea
          value={domainKnowledge}
          onChange={setDomainKnowledge}
          rows={7}
          placeholder={`e.g. TechCorp has a flat pay structure. Merit raises are capped at 10% per cycle. The learner joined 2 years ago and received an "Exceeds Expectations" review. Industry benchmarks show them paid 15% below market rate...`}
        />

        {/* Upload feedback */}
        {uploadMsg && (
          <p
            className="meta mt-1.5"
            style={{
              fontSize: '10px',
              color: uploadState === 'error' ? '#c44' : 'var(--color-ash)',
            }}
          >
            {uploadState === 'done' ? '✓ ' : ''}{uploadMsg}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <FieldLabel>CEFR Levels</FieldLabel>
          <div className="flex gap-2 flex-wrap mt-1">
            {CEFR_LEVELS.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => toggleCefr(l)}
                className="meta px-3 py-1.5 border transition-all"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  borderColor: cefrLevels.includes(l) ? 'var(--color-ink)' : 'var(--color-fog)',
                  backgroundColor: cefrLevels.includes(l) ? 'var(--color-ink)' : 'transparent',
                  color: cefrLevels.includes(l) ? 'white' : 'var(--color-ash)',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Tags (comma-separated)</FieldLabel>
          <TextInput value={tags} onChange={setTags} placeholder="business, negotiation, HR" />
        </div>
      </div>

      {/* Number of characters */}
      <div>
        <FieldLabel hint="How many AI characters will be in the room?">Number of Characters</FieldLabel>
        <div className="flex gap-px mt-1" style={{ backgroundColor: 'var(--color-fog)' }}>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setNumCharacters(n)}
              className="flex-1 py-3 font-body text-[13px] transition-all"
              style={{
                backgroundColor: numCharacters === n ? 'var(--color-ink)' : 'var(--color-surface)',
                color: numCharacters === n ? 'white' : 'var(--color-ash)',
              }}
            >
              {n} {n === 1 ? 'Character' : 'Characters'}
            </button>
          ))}
        </div>
        <p className="font-body text-[12px] mt-2" style={{ color: 'var(--color-ash)' }}>
          {numCharacters === 1 && 'One-on-one conversation — focused and direct.'}
          {numCharacters === 2 && 'Two characters with different perspectives — natural debate.'}
          {numCharacters === 3 && 'Full room dynamic — complex multi-party conversation.'}
        </p>
      </div>

      {error && <p className="font-body text-[13px]" style={{ color: '#c44' }}>{error}</p>}

      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-fog)' }}>
        <button
          onClick={onGenerate}
          disabled={!canGenerate || generating}
          className="w-full py-4 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40 flex items-center justify-center gap-3"
          style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
        >
          {generating ? <><Spinner /> Generating characters...</> : `Generate ${numCharacters} Character${numCharacters > 1 ? 's' : ''} with AI →`}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Characters ───────────────────────────────────────────────────────

function StepCharacters({
  characters,
  onUpdate,
  onRegenerate,
  regenerating,
  onNext,
}: {
  characters: CharacterDraft[];
  onUpdate: (i: number, field: keyof CharacterDraft, value: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
  onNext: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="font-body text-[14px]" style={{ color: 'var(--color-ash)' }}>
          Review and refine the AI-generated characters. Adjust persona or bias to fit your vision.
        </p>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="meta hover:underline flex items-center gap-2 flex-shrink-0 ml-6"
          style={{ fontSize: '11px', color: 'var(--color-ash)' }}
        >
          {regenerating ? <><Spinner /> Regenerating...</> : '↻ Regenerate all'}
        </button>
      </div>

      <div className="space-y-px" style={{ backgroundColor: 'var(--color-fog)' }}>
        {characters.map((char, i) => (
          <div key={i} className="p-7" style={{ backgroundColor: 'var(--color-surface)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              {/* Avatar color picker */}
              <div className="flex gap-1.5">
                {AVATAR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onUpdate(i, 'avatar_preset', preset.id)}
                    title={preset.label}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: preset.color,
                      border: char.avatar_preset === preset.id ? '2px solid var(--color-ink)' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
              <span className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Character {i + 1}</span>
            </div>

            {/* Visual preset picker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="meta block" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Visual Appearance</label>
                <span className="meta" style={{ fontSize: '9px', color: 'var(--color-ash)', letterSpacing: '0.08em' }}>
                  PLACEHOLDER · 3D MODELS COMING
                </span>
              </div>
              <div className="grid grid-cols-6 gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
                {VISUAL_PRESETS.map(vp => {
                  const accentColor = AVATAR_PRESETS.find(p => p.id === char.avatar_preset)?.color ?? '#4a90d9';
                  const selected = char.visual_preset === vp.id;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => onUpdate(i, 'visual_preset', vp.id)}
                      title={vp.style}
                      className="flex flex-col items-center transition-all"
                      style={{
                        backgroundColor: selected ? 'var(--color-ink)' : 'var(--color-surface)',
                        padding: '10px 6px 8px',
                        outline: 'none',
                      }}
                    >
                      {/* Silhouette preview */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: selected ? 'rgba(255,255,255,0.12)' : 'var(--color-paper)',
                          marginBottom: 6,
                          opacity: selected ? 1 : 0.85,
                        }}
                      >
                        <CharacterSilhouette
                          type={vp.silhouette}
                          color={selected ? 'rgba(255,255,255,0.9)' : accentColor}
                        />
                      </div>
                      <span
                        className="meta block text-center"
                        style={{
                          fontSize: '8px',
                          letterSpacing: '0.08em',
                          color: selected ? 'white' : 'var(--color-ash)',
                          lineHeight: 1.2,
                        }}
                      >
                        {vp.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name + Role */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="meta block mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Name *</label>
                <input
                  value={char.name}
                  onChange={e => onUpdate(i, 'name', e.target.value)}
                  className="w-full px-3 py-2.5 border font-body text-[14px] outline-none font-medium"
                  style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                />
              </div>
              <div>
                <label className="meta block mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Role *</label>
                <input
                  value={char.role}
                  onChange={e => onUpdate(i, 'role', e.target.value)}
                  className="w-full px-3 py-2.5 border font-body text-[14px] outline-none"
                  style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                />
              </div>
            </div>

            {/* Persona */}
            <div className="mb-4">
              <label className="meta block mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Persona</label>
              <textarea
                value={char.persona}
                onChange={e => onUpdate(i, 'persona', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border font-body text-[13px] outline-none resize-none leading-relaxed"
                style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
              />
            </div>

            {/* Bias */}
            <div className="mb-6">
              <label className="meta block mb-1.5" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Bias / Perspective</label>
              <textarea
                value={char.bias_perception}
                onChange={e => onUpdate(i, 'bias_perception', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border font-body text-[13px] outline-none resize-none leading-relaxed"
                style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
              />
            </div>

            {/* Voice picker */}
            <div>
              <label className="meta block mb-3" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Voice</label>
              <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
                {VOICES.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onUpdate(i, 'voice_id', v.id)}
                    className="px-3 py-2.5 text-left transition-all"
                    style={{
                      backgroundColor: char.voice_id === v.id ? 'var(--color-ink)' : 'var(--color-surface)',
                    }}
                  >
                    <span
                      className="font-body font-medium block text-[13px]"
                      style={{ color: char.voice_id === v.id ? 'white' : 'var(--color-ink)' }}
                    >
                      {v.label}
                    </span>
                    <span
                      className="meta block"
                      style={{ fontSize: '9px', color: char.voice_id === v.id ? 'rgba(255,255,255,0.55)' : 'var(--color-ash)' }}
                    >
                      {v.gender} · {v.style}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-fog)' }}>
        <button
          onClick={onNext}
          disabled={characters.some(c => !c.name.trim() || !c.role.trim())}
          className="w-full py-4 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
        >
          Generate Sample Conversation →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Conversation ─────────────────────────────────────────────────────

function StepConversation({
  conversation,
  characters,
  generating,
  onRegenerate,
  onNext,
}: {
  conversation: ConversationTurn[];
  characters: CharacterDraft[];
  generating: boolean;
  onRegenerate: () => void;
  onNext: () => void;
}) {
  const charNames = characters.map(c => c.name);
  const avatarColor = (name: string) => {
    const char = characters.find(c => c.name === name);
    if (!char) return 'var(--color-ink)';
    const preset = AVATAR_PRESETS.find(p => p.id === char.avatar_preset);
    return preset?.color ?? 'var(--color-ink)';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-body text-[14px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            This sample conversation will be provided as context to your AI characters so they understand
            the tone, dynamic, and expected exchanges in this world.
          </p>
        </div>
        <button
          onClick={onRegenerate}
          disabled={generating}
          className="meta hover:underline flex items-center gap-2 flex-shrink-0"
          style={{ fontSize: '11px', color: 'var(--color-ash)' }}
        >
          {generating ? <><Spinner /> Regenerating...</> : '↻ Regenerate'}
        </button>
      </div>

      {generating ? (
        <div className="py-16 flex flex-col items-center gap-4" style={{ borderTop: '1px solid var(--color-fog)' }}>
          <Spinner />
          <p className="meta" style={{ fontSize: '11px' }}>Generating conversation...</p>
        </div>
      ) : (
        <div className="border" style={{ borderColor: 'var(--color-fog)', maxHeight: '520px', overflowY: 'auto' }}>
          <div className="p-6 space-y-4">
            {conversation.map((turn, i) => {
              const isUser = turn.speaker === 'User';
              return (
                <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {!isUser && (
                      <div
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          backgroundColor: avatarColor(turn.speaker),
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span className="meta" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
                      {isUser ? 'LEARNER' : turn.speaker.toUpperCase()}
                    </span>
                  </div>
                  <div
                    className="max-w-[80%] px-4 py-2.5 font-body text-[13px] leading-relaxed"
                    style={{
                      backgroundColor: isUser ? 'var(--color-ink)' : 'var(--color-surface)',
                      color: isUser ? 'white' : 'var(--color-ink)',
                      border: isUser ? 'none' : '1px solid var(--color-fog)',
                    }}
                  >
                    {turn.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Character legend */}
      <div className="flex items-center gap-6">
        {characters.map(char => {
          const preset = AVATAR_PRESETS.find(p => p.id === char.avatar_preset);
          return (
            <div key={char.name} className="flex items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: preset?.color ?? '#999' }} />
              <span className="meta" style={{ fontSize: '10px' }}>{char.name} — {char.role}</span>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-fog)' }}>
        <button
          onClick={onNext}
          disabled={generating || conversation.length === 0}
          className="w-full py-4 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
        >
          Review & Publish →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Publish ──────────────────────────────────────────────────────────

function StepPublish({
  title, description, domainKnowledge, tags, cefrLevels, characters, conversation,
  saving, onSave, error,
}: {
  title: string; description: string; domainKnowledge: string;
  tags: string; cefrLevels: string[]; characters: CharacterDraft[];
  conversation: ConversationTurn[]; saving: boolean;
  onSave: (publish: boolean) => void; error: string;
}) {
  return (
    <div className="space-y-8">
      <p className="font-body text-[14px]" style={{ color: 'var(--color-ash)' }}>
        Review your world before publishing to the catalog.
      </p>

      {/* Summary card */}
      <div className="border p-7 space-y-6" style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)' }}>
        {/* Title & meta */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            {cefrLevels.map(l => (
              <span key={l} className="meta px-2 py-0.5 border" style={{ fontSize: '9px', borderColor: 'var(--color-fog)' }}>{l}</span>
            ))}
            {tags.split(',').filter(Boolean).map(t => (
              <span key={t} className="meta" style={{ fontSize: '10px' }}>{t.trim()}</span>
            ))}
          </div>
          <h2 className="font-display text-[32px] font-semibold leading-[1.1] mb-2" style={{ color: 'var(--color-ink)' }}>
            {title}
          </h2>
          {description && (
            <p className="font-body text-[14px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>{description}</p>
          )}
        </div>

        {/* Domain knowledge excerpt */}
        <div className="pt-5 border-t" style={{ borderColor: 'var(--color-fog)' }}>
          <span className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Background Context</span>
          <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--color-ink)' }}>
            {domainKnowledge.slice(0, 300)}{domainKnowledge.length > 300 ? '…' : ''}
          </p>
        </div>

        {/* Characters */}
        <div className="pt-5 border-t" style={{ borderColor: 'var(--color-fog)' }}>
          <span className="meta block mb-4" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
            {characters.length} Character{characters.length > 1 ? 's' : ''}
          </span>
          <div className="grid grid-cols-1 gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
            {characters.map((char, i) => {
              const colorPreset = AVATAR_PRESETS.find(p => p.id === char.avatar_preset);
              const voice = VOICES.find(v => v.id === char.voice_id);
              const visual = VISUAL_PRESETS.find(v => v.id === char.visual_preset);
              return (
                <div key={i} className="flex gap-4 px-5 py-4" style={{ backgroundColor: 'var(--color-paper)' }}>
                  {/* Mini silhouette avatar */}
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 2, flexShrink: 0, overflow: 'hidden',
                      backgroundColor: colorPreset?.color ?? '#999',
                    }}
                  >
                    {visual && (
                      <CharacterSilhouette
                        type={visual.silhouette}
                        color="rgba(255,255,255,0.88)"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-body font-medium text-[15px]" style={{ color: 'var(--color-ink)' }}>{char.name}</span>
                      <span className="meta" style={{ fontSize: '10px' }}>{char.role}</span>
                      <span className="meta ml-auto flex items-center gap-2" style={{ fontSize: '10px', color: 'var(--color-ash)' }}>
                        {visual?.label ?? '—'} · {voice?.label ?? 'Default'} voice
                      </span>
                    </div>
                    <p className="font-body text-[12px] leading-relaxed line-clamp-2" style={{ color: 'var(--color-ash)' }}>
                      {char.persona}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation preview */}
        {conversation.length > 0 && (
          <div className="pt-5 border-t" style={{ borderColor: 'var(--color-fog)' }}>
            <span className="meta block mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
              Sample Conversation · {conversation.length} exchanges
            </span>
            <div className="space-y-2">
              {conversation.slice(0, 4).map((turn, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="meta flex-shrink-0 w-16 text-right" style={{ fontSize: '9px', paddingTop: '1px' }}>
                    {turn.speaker === 'User' ? 'LEARNER' : turn.speaker.toUpperCase()}
                  </span>
                  <p className="font-body text-[12px] leading-relaxed flex-1" style={{ color: 'var(--color-ash)' }}>
                    "{turn.text.slice(0, 120)}{turn.text.length > 120 ? '…' : ''}"
                  </p>
                </div>
              ))}
              {conversation.length > 4 && (
                <p className="meta" style={{ fontSize: '10px' }}>+ {conversation.length - 4} more exchanges</p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="font-body text-[13px]" style={{ color: '#c44' }}>{error}</p>}

      <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-fog)' }}>
        <button
          onClick={() => onSave(false)}
          disabled={saving}
          className="flex-1 py-3.5 font-body text-[13px] border transition-all disabled:opacity-40"
          style={{ borderColor: 'var(--color-ink)', color: 'var(--color-ink)' }}
        >
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
        <button
          onClick={() => onSave(true)}
          disabled={saving}
          className="flex-1 py-3.5 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
        >
          {saving ? <><Spinner /> Publishing…</> : 'Publish to Catalog →'}
        </button>
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

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
