import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { topicsApi } from '../services/api';
import { Topic } from '../types';
import { Navbar } from './DashboardPage';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const AVATAR_PRESETS = ['default', 'professional', 'academic', 'casual', 'formal', 'creative'];
const VOICE_IDS = [
  { id: 'alloy', label: 'Alloy (Neutral)' },
  { id: 'echo', label: 'Echo (Male)' },
  { id: 'fable', label: 'Fable (Warm)' },
  { id: 'onyx', label: 'Onyx (Deep)' },
  { id: 'nova', label: 'Nova (Female)' },
  { id: 'shimmer', label: 'Shimmer (Bright)' },
];

interface CharacterForm {
  id?: string;
  name: string;
  role: string;
  persona: string;
  bias_perception: string;
  voice_id: string;
  avatar_preset: string;
}

const emptyCharacter = (): CharacterForm => ({
  name: '',
  role: '',
  persona: '',
  bias_perception: '',
  voice_id: 'alloy',
  avatar_preset: 'default',
});

interface TopicForm {
  title: string;
  description: string;
  domain_knowledge: string;
  cefr_levels: string[];
  tags: string;
  characters: CharacterForm[];
}

export default function TopicEditorPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [originalTopic, setOriginalTopic] = useState<Topic | null>(null);

  const [form, setForm] = useState<TopicForm>({
    title: '',
    description: '',
    domain_knowledge: '',
    cefr_levels: [],
    tags: '',
    characters: [emptyCharacter()],
  });

  useEffect(() => {
    if (!topicId) return;
    topicsApi.get(topicId)
      .then(res => {
        const topic: Topic = res.data;
        setOriginalTopic(topic);
        setForm({
          title: topic.title || '',
          description: topic.description || '',
          domain_knowledge: topic.domain_knowledge || '',
          cefr_levels: topic.cefr_levels || [],
          tags: (topic.tags || []).join(', '),
          characters: topic.characters?.length > 0
            ? topic.characters.map(c => ({
                id: c.id,
                name: c.name,
                role: c.role,
                persona: c.persona,
                bias_perception: c.bias_perception,
                voice_id: c.voice_id || 'alloy',
                avatar_preset: c.avatar_preset || 'default',
              }))
            : [emptyCharacter()],
        });
      })
      .catch(() => navigate('/studio'))
      .finally(() => setLoading(false));
  }, [topicId]);

  const updateField = (field: keyof TopicForm, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleCEFR = (level: string) => {
    setForm(prev => ({
      ...prev,
      cefr_levels: prev.cefr_levels.includes(level)
        ? prev.cefr_levels.filter(l => l !== level)
        : [...prev.cefr_levels, level],
    }));
  };

  const addCharacter = () => {
    if (form.characters.length >= 3) return;
    setForm(prev => ({ ...prev, characters: [...prev.characters, emptyCharacter()] }));
  };

  const removeCharacter = (idx: number) => {
    if (form.characters.length <= 1) return;
    setForm(prev => ({ ...prev, characters: prev.characters.filter((_, i) => i !== idx) }));
  };

  const updateCharacter = (idx: number, field: keyof CharacterForm, value: string) => {
    setForm(prev => ({
      ...prev,
      characters: prev.characters.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.domain_knowledge.trim()) newErrors.domain_knowledge = 'Background knowledge is required';
    if (form.characters.length === 0) newErrors.characters = 'At least one character is required';
    form.characters.forEach((c, i) => {
      if (!c.name.trim()) newErrors[`char_${i}_name`] = 'Name required';
      if (!c.role.trim()) newErrors[`char_${i}_role`] = 'Role required';
      if (!c.persona.trim()) newErrors[`char_${i}_persona`] = 'Persona required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (publish = false) => {
    if (!validate() || !topicId) return;
    setSaving(true);
    setGlobalError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        domain_knowledge: form.domain_knowledge,
        cefr_levels: form.cefr_levels,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        characters: form.characters,
      };
      await topicsApi.update(topicId, payload);
      if (publish && originalTopic?.status !== 'published') {
        await topicsApi.publish(topicId).catch(() => {});
      }
      navigate('/studio');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setGlobalError(axiosErr.response?.data?.detail || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/studio" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Studio
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Topic</h1>
            {originalTopic && (
              <p className="text-gray-500 text-xs mt-0.5">
                {originalTopic.status === 'published' ? 'Currently published' : 'Draft'}
              </p>
            )}
          </div>
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {globalError}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <Section title="Basic Information" icon="📝">
            <FormField label="Title" error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Climate Policy Debate at the UN"
                className={inputClass(errors.title)}
              />
            </FormField>

            <FormField label="Description" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="A brief description of the conversation scenario..."
                rows={3}
                className={inputClass(errors.description)}
              />
            </FormField>

            <FormField
              label="Background Knowledge"
              description="Context and facts all characters share — this shapes how they reason and respond."
              error={errors.domain_knowledge}
            >
              <textarea
                value={form.domain_knowledge}
                onChange={(e) => updateField('domain_knowledge', e.target.value)}
                placeholder="Provide detailed background information about the topic domain..."
                rows={6}
                className={inputClass(errors.domain_knowledge)}
              />
            </FormField>
          </Section>

          {/* CEFR + Tags */}
          <Section title="Target Learners" icon="🎓">
            <FormField label="CEFR Levels" description="Select which language levels this topic is appropriate for">
              <div className="flex flex-wrap gap-2">
                {CEFR_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleCEFR(level)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      form.cefr_levels.includes(level)
                        ? 'border-accent-500 bg-accent-500/20 text-accent-400'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Tags" description="Comma-separated tags for discovery">
              <input
                type="text"
                value={form.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="debate, climate, formal, science"
                className={inputClass()}
              />
            </FormField>
          </Section>

          {/* Characters */}
          <Section title="AI Characters" icon="🎭">
            <p className="text-gray-400 text-sm mb-4">
              Add 1–3 AI characters. Each will have a unique persona and voice in the conversation.
            </p>

            {errors.characters && (
              <p className="text-red-400 text-sm mb-4">{errors.characters}</p>
            )}

            <div className="space-y-4">
              {form.characters.map((char, idx) => (
                <CharacterFormSection
                  key={idx}
                  index={idx}
                  character={char}
                  onChange={(field, value) => updateCharacter(idx, field, value)}
                  onRemove={() => removeCharacter(idx)}
                  canRemove={form.characters.length > 1}
                  errors={errors}
                />
              ))}
            </div>

            {form.characters.length < 3 && (
              <button
                type="button"
                onClick={addCharacter}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-700 hover:border-accent-500 text-gray-400 hover:text-accent-400 rounded-xl text-sm font-medium transition-all"
              >
                + Add Character ({form.characters.length}/3)
              </button>
            )}
          </Section>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {originalTopic?.status !== 'published' && (
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex-1 py-3 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                {saving ? 'Publishing...' : 'Save & Publish'}
              </button>
            )}
            <Link
              to="/studio"
              className="px-6 py-3 bg-gray-900 border border-gray-700 text-gray-400 hover:text-white rounded-xl font-medium transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function CharacterFormSection({
  index,
  character,
  onChange,
  onRemove,
  canRemove,
  errors,
}: {
  index: number;
  character: CharacterForm;
  onChange: (field: keyof CharacterForm, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors: Record<string, string>;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Character {index + 1}</h3>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Name" error={errors[`char_${index}_name`]}>
          <input
            type="text"
            value={character.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g. Professor Chen"
            className={inputClass(errors[`char_${index}_name`])}
          />
        </FormField>

        <FormField label="Role" error={errors[`char_${index}_role`]}>
          <input
            type="text"
            value={character.role}
            onChange={(e) => onChange('role', e.target.value)}
            placeholder="e.g. Climate Scientist"
            className={inputClass(errors[`char_${index}_role`])}
          />
        </FormField>
      </div>

      <FormField label="Persona" description="How this character thinks and speaks" error={errors[`char_${index}_persona`]}>
        <textarea
          value={character.persona}
          onChange={(e) => onChange('persona', e.target.value)}
          placeholder="Describe their personality, speaking style, expertise..."
          rows={3}
          className={inputClass(errors[`char_${index}_persona`])}
        />
      </FormField>

      <FormField label="Bias & Perception" description="Hidden communication tendencies (not shown to learner)">
        <textarea
          value={character.bias_perception}
          onChange={(e) => onChange('bias_perception', e.target.value)}
          placeholder="Describe subtle biases or conversational tendencies..."
          rows={2}
          className={inputClass()}
        />
      </FormField>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Voice">
          <select
            value={character.voice_id}
            onChange={(e) => onChange('voice_id', e.target.value)}
            className={inputClass()}
          >
            {VOICE_IDS.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Avatar Style">
          <select
            value={character.avatar_preset}
            onChange={(e) => onChange('avatar_preset', e.target.value)}
            className={inputClass()}
          >
            {AVATAR_PRESETS.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function inputClass(error?: string): string {
  return `w-full px-4 py-3 bg-gray-800 border ${
    error ? 'border-red-500' : 'border-gray-700'
  } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors text-sm resize-y`;
}
