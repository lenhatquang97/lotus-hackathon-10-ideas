import { useState } from 'react';
import type { Character } from '../../types';

interface DraftCharacterCardProps {
  character: Character;
  index: number;
  onChange: (updated: Character) => void;
}

function InlineField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="font-ui text-[9px] tracking-widest uppercase block mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
      <input
        className="w-full font-body text-sm border-0 border-b py-1 px-0 outline-none transition-colors duration-200"
        style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent-border)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
      />
    </div>
  );
}

function InlineTextarea({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="font-ui text-[9px] tracking-widest uppercase block mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
      <textarea
        className="w-full font-body text-sm border-0 border-b py-1 px-0 outline-none resize-y transition-colors duration-200"
        style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent-border)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
      />
    </div>
  );
}

export function DraftCharacterCard({ character, index, onChange }: DraftCharacterCardProps) {
  const [editing, setEditing] = useState(false);

  const update = (field: keyof Character, value: string) => {
    onChange({ ...character, [field]: value });
  };

  return (
    <div className="border p-5 px-6 mb-3 transition-colors duration-200" style={{ borderColor: editing ? 'var(--color-text-secondary)' : 'var(--color-border)', borderRadius: '2px' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-ui text-[11px] tracking-wide" style={{ color: 'var(--color-border)' }}>{String(index + 1).padStart(2, '0')}</span>
          <span className="font-ui text-[9px] tracking-widest uppercase border px-2 py-0.5" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', borderRadius: '2px' }}>{character.role}</span>
        </div>
        <button
          className="bg-transparent border-none font-ui text-[10px] tracking-widest uppercase underline underline-offset-2 cursor-pointer transition-colors duration-200"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={() => setEditing(!editing)}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-4">
          <InlineField label="Name" value={character.name} onChange={(v) => update('name', v)} />
          <InlineField label="Role" value={character.role} onChange={(v) => update('role', v)} />
          <InlineTextarea label="Persona" value={character.persona} onChange={(v) => update('persona', v)} rows={3} />
          <InlineTextarea label="Bias / Perspective" value={character.bias_perception} onChange={(v) => update('bias_perception', v)} rows={2} />
        </div>
      ) : (
        <div>
          <p className="font-display text-xl font-normal mb-1" style={{ color: 'var(--color-text-primary)' }}>{character.name}</p>
          <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{character.persona || 'No persona defined'}</p>
        </div>
      )}
    </div>
  );
}
