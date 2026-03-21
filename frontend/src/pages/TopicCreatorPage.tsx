import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { topicsApi } from '../services/api';
import { Navbar } from '../components/Navbar';

interface CharacterForm {
  name: string; role: string; persona: string; bias_perception: string; voice_id: string; avatar_preset: string;
}

const EMPTY_CHAR: CharacterForm = { name: '', role: '', persona: '', bias_perception: '', voice_id: 'default', avatar_preset: 'default' };
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function TopicCreatorPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domainKnowledge, setDomainKnowledge] = useState('');
  const [tags, setTags] = useState('');
  const [cefrLevels, setCefrLevels] = useState<string[]>(['B2']);
  const [characters, setCharacters] = useState<CharacterForm[]>([{ ...EMPTY_CHAR }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleCefr = (l: string) => setCefrLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const updateChar = (i: number, field: keyof CharacterForm, value: string) =>
    setCharacters(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const addChar = () => characters.length < 3 && setCharacters(prev => [...prev, { ...EMPTY_CHAR }]);
  const removeChar = (i: number) => setCharacters(prev => prev.filter((_, idx) => idx !== i));

  const save = async (publish: boolean) => {
    setError('');
    if (!title.trim()) return setError('Title is required');
    if (characters.length < 1) return setError('At least one character required');
    if (characters.some(c => !c.name.trim() || !c.role.trim())) return setError('All characters need a name and role');

    setSaving(true);
    try {
      const res = await topicsApi.create({
        title, description, domain_knowledge: domainKnowledge,
        cefr_levels: cefrLevels,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        characters,
      });
      if (publish) {
        await topicsApi.publish(res.data.id);
        navigate('/topics');
      } else {
        navigate('/studio');
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="max-w-[800px] mx-auto px-12 py-16">
        <div className="mb-10">
          <Link to="/studio" className="meta hover:underline mb-4 inline-block" style={{ fontSize: '11px' }}>← Studio</Link>
          <h1 className="font-display text-[48px] italic" style={{ color: 'var(--color-ink)' }}>Create World</h1>
          <p className="font-body text-[15px] mt-2" style={{ color: 'var(--color-ash)' }}>Define a conversation scenario for learners to inhabit.</p>
        </div>

        <div className="space-y-8">
          {/* Title */}
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>World Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
              placeholder="e.g. Negotiating a Salary Raise" />
          </div>

          {/* Description */}
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Short Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none resize-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
              placeholder="Brief summary shown in the catalog..." />
          </div>

          {/* Domain Knowledge */}
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Background Context *</label>
            <p className="font-body text-[12px] mb-3" style={{ color: 'var(--color-ash)' }}>
              Shared context all characters know. Include facts, constraints, and situation details.
            </p>
            <textarea value={domainKnowledge} onChange={e => setDomainKnowledge(e.target.value)} rows={6}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none resize-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
              placeholder="e.g. The company has a flat pay structure, merit raises capped at 10%..." />
          </div>

          {/* CEFR */}
          <div>
            <label className="meta block mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>CEFR Levels</label>
            <div className="flex gap-2 flex-wrap">
              {CEFR_LEVELS.map(l => (
                <button key={l} type="button" onClick={() => toggleCefr(l)}
                  className="meta px-3 py-1.5 border transition-all"
                  style={{ fontSize: '10px', letterSpacing: '0.1em', borderColor: cefrLevels.includes(l) ? 'var(--color-ink)' : 'var(--color-fog)', backgroundColor: cefrLevels.includes(l) ? 'var(--color-ink)' : 'transparent', color: cefrLevels.includes(l) ? 'white' : 'var(--color-ash)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Tags (comma-separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
              placeholder="business, negotiation, HR" />
          </div>

          {/* Characters */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <label className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Characters ({characters.length}/3)</label>
              {characters.length < 3 && (
                <button type="button" onClick={addChar}
                  className="meta hover:underline" style={{ fontSize: '10px', color: 'var(--color-ink)' }}>
                  + Add Character
                </button>
              )}
            </div>

            <div className="space-y-px" style={{ backgroundColor: 'var(--color-fog)' }}>
              {characters.map((char, i) => (
                <div key={i} className="p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Character {i + 1}</span>
                    {characters.length > 1 && (
                      <button type="button" onClick={() => removeChar(i)}
                        className="meta hover:underline" style={{ fontSize: '10px', color: 'var(--color-ash)' }}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Name *</label>
                      <input value={char.name} onChange={e => updateChar(i, 'name', e.target.value)}
                        className="w-full px-3 py-2 border font-body text-[13px] outline-none"
                        style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                        placeholder="e.g. Sarah" />
                    </div>
                    <div>
                      <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Role *</label>
                      <input value={char.role} onChange={e => updateChar(i, 'role', e.target.value)}
                        className="w-full px-3 py-2 border font-body text-[13px] outline-none"
                        style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                        placeholder="e.g. HR Manager" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Persona</label>
                    <textarea value={char.persona} onChange={e => updateChar(i, 'persona', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border font-body text-[13px] outline-none resize-none"
                      style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                      placeholder="Personality, communication style, tone..." />
                  </div>

                  <div>
                    <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Bias / Perspective</label>
                    <textarea value={char.bias_perception} onChange={e => updateChar(i, 'bias_perception', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border font-body text-[13px] outline-none resize-none"
                      style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                      placeholder="Their viewpoint, opinions, what they believe..." />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="font-body text-[13px]" style={{ color: '#c44' }}>{error}</p>}

          <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-fog)' }}>
            <button onClick={() => save(false)} disabled={saving}
              className="flex-1 py-3 font-body text-[13px] border transition-all disabled:opacity-40 hover:bg-ink hover:text-white hover:border-ink"
              style={{ borderColor: 'var(--color-ink)', color: 'var(--color-ink)' }}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button onClick={() => save(true)} disabled={saving}
              className="flex-1 py-3 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}>
              {saving ? 'Publishing...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
