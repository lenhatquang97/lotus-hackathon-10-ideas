import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { topicsApi } from '../services/api';
import { Navbar } from '../components/Navbar';

interface CharacterForm {
  id?: string; name: string; role: string; persona: string; bias_perception: string; voice_id: string; avatar_preset: string;
}

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function TopicEditorPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domainKnowledge, setDomainKnowledge] = useState('');
  const [tags, setTags] = useState('');
  const [difficultyLevels, setDifficultyLevels] = useState<string[]>(['Intermediate']);
  const [characters, setCharacters] = useState<CharacterForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!topicId) return;
    topicsApi.get(topicId).then(r => {
      const t = r.data;
      setTitle(t.title);
      setDescription(t.description);
      setDomainKnowledge(t.domain_knowledge);
      setTags(t.tags.join(', '));
      setDifficultyLevels(t.difficulty_levels);
      setCharacters(t.characters.map((c: any) => ({
        id: c.id, name: c.name, role: c.role, persona: c.persona,
        bias_perception: c.bias_perception, voice_id: c.voice_id || 'default', avatar_preset: c.avatar_preset || 'default'
      })));
      setLoaded(true);
    });
  }, [topicId]);

  const toggleDifficulty = (l: string) => setDifficultyLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  const updateChar = (i: number, field: keyof CharacterForm, value: string) =>
    setCharacters(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  const addChar = () => characters.length < 3 && setCharacters(prev => [...prev, { name: '', role: '', persona: '', bias_perception: '', voice_id: 'default', avatar_preset: 'default' }]);
  const removeChar = (i: number) => setCharacters(prev => prev.filter((_, idx) => idx !== i));

  const save = async (publish: boolean) => {
    setError('');
    if (!title.trim()) return setError('Title is required');
    if (characters.some(c => !c.name.trim() || !c.role.trim())) return setError('All characters need a name and role');
    setSaving(true);
    try {
      await topicsApi.update(topicId!, {
        title, description, domain_knowledge: domainKnowledge,
        difficulty_levels: difficultyLevels,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        characters: characters.map(({ id: _id, ...c }) => c),
      });
      if (publish) await topicsApi.publish(topicId!);
      navigate('/studio');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 meta">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <div className="max-w-[800px] mx-auto px-12 py-16">
        <div className="mb-10">
          <Link to="/studio" className="meta hover:underline mb-4 inline-block" style={{ fontSize: '11px' }}>← Studio</Link>
          <h1 className="font-display text-[48px] italic" style={{ color: 'var(--color-ink)' }}>Edit World</h1>
        </div>

        <div className="space-y-8">
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }} />
          </div>
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none resize-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }} />
          </div>
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Background Context</label>
            <textarea value={domainKnowledge} onChange={e => setDomainKnowledge(e.target.value)} rows={6}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none resize-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }} />
          </div>
          <div>
            <label className="meta block mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Difficulty</label>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTY_LEVELS.map(l => (
                <button key={l} type="button" onClick={() => toggleDifficulty(l)}
                  className="meta px-3 py-1.5 border transition-all"
                  style={{ fontSize: '10px', borderColor: difficultyLevels.includes(l) ? 'var(--color-ink)' : 'var(--color-fog)', backgroundColor: difficultyLevels.includes(l) ? 'var(--color-ink)' : 'transparent', color: difficultyLevels.includes(l) ? 'white' : 'var(--color-ash)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Tags (comma-separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              className="w-full px-4 py-3 border font-body text-[14px] outline-none"
              style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }} />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <label className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Characters ({characters.length}/3)</label>
              {characters.length < 3 && (
                <button type="button" onClick={addChar} className="meta hover:underline" style={{ fontSize: '10px', color: 'var(--color-ink)' }}>+ Add</button>
              )}
            </div>
            <div className="space-y-px" style={{ backgroundColor: 'var(--color-fog)' }}>
              {characters.map((char, i) => (
                <div key={i} className="p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Character {i + 1}</span>
                    {characters.length > 1 && (
                      <button type="button" onClick={() => removeChar(i)} className="meta hover:underline" style={{ fontSize: '10px', color: 'var(--color-ash)' }}>Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Name *</label>
                      <input value={char.name} onChange={e => updateChar(i, 'name', e.target.value)}
                        className="w-full px-3 py-2 border font-body text-[13px] outline-none"
                        style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }} />
                    </div>
                    <div>
                      <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Role *</label>
                      <input value={char.role} onChange={e => updateChar(i, 'role', e.target.value)}
                        className="w-full px-3 py-2 border font-body text-[13px] outline-none"
                        style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Persona</label>
                    <textarea value={char.persona} onChange={e => updateChar(i, 'persona', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border font-body text-[13px] outline-none resize-none"
                      style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }} />
                  </div>
                  <div>
                    <label className="meta block mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Bias / Perspective</label>
                    <textarea value={char.bias_perception} onChange={e => updateChar(i, 'bias_perception', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border font-body text-[13px] outline-none resize-none"
                      style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }} />
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
              {saving ? 'Saving...' : 'Save Draft'}
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
