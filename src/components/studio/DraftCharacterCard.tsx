'use client';

import { useState } from 'react';
import type { AgentPersona } from '@/lib/types';

interface DraftCharacterCardProps {
  character: AgentPersona;
  index: number;
  onChange: (updated: AgentPersona) => void;
}

function InlineField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-ui text-[9px] tracking-[0.12em] uppercase block mb-[5px]" style={{ color: 'var(--color-ash)' }}>
        {label}
      </label>
      <input
        className="w-full font-body text-[13px] bg-[var(--color-paper)] border-0 border-b border-b-[var(--color-fog)] rounded-none py-[6px] px-0 outline-none transition-colors duration-[220ms] focus:border-b-[var(--color-ink)]"
        style={{ color: 'var(--color-ink)' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function InlineTextarea({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="font-ui text-[9px] tracking-[0.12em] uppercase block mb-[5px]" style={{ color: 'var(--color-ash)' }}>
        {label}
      </label>
      <textarea
        className="w-full font-body text-[13px] bg-[var(--color-paper)] border-0 border-b border-b-[var(--color-fog)] rounded-none py-[6px] px-0 outline-none resize-y transition-colors duration-[220ms] focus:border-b-[var(--color-ink)]"
        style={{ color: 'var(--color-ink)' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
}

export function DraftCharacterCard({ character, index, onChange }: DraftCharacterCardProps) {
  const [editing, setEditing] = useState(false);

  const update = (field: keyof AgentPersona, value: string | number | string[]) => {
    onChange({ ...character, [field]: value });
  };

  return (
    <div
      className={`border rounded-[2px] p-5 px-6 mb-3 transition-colors duration-[220ms] ${
        editing ? 'border-[var(--color-ash)]' : 'border-[var(--color-fog)] hover:border-[var(--color-ash)]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-[10px]">
          <span className="font-ui text-[11px] tracking-[0.06em]" style={{ color: 'var(--color-fog)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className="font-ui text-[9px] tracking-[0.12em] uppercase border rounded-[2px] px-2 py-[2px]"
            style={{ color: 'var(--color-ash)', borderColor: 'var(--color-fog)' }}
          >
            {character.role}
          </span>
        </div>
        <button
          className="bg-transparent border-none font-ui text-[10px] tracking-[0.10em] uppercase underline underline-offset-[3px] cursor-pointer transition-colors duration-[220ms] hover:text-[var(--color-ink)]"
          style={{ color: 'var(--color-ash)' }}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-4">
          <InlineField label="Name" value={character.name} onChange={(v) => update('name', v)} />
          <InlineField label="Profession" value={character.profession} onChange={(v) => update('profession', v)} />
          <InlineTextarea label="Personality" value={character.personality} onChange={(v) => update('personality', v)} rows={3} />
          <InlineField label="Accent" value={character.accent} onChange={(v) => update('accent', v)} />
          <InlineField label="Communication Style" value={character.communicationStyle} onChange={(v) => update('communicationStyle', v as AgentPersona['communicationStyle'])} />
        </div>
      ) : (
        <div>
          <p className="font-display text-[20px] font-normal mb-[6px]" style={{ color: 'var(--color-ink)' }}>
            {character.name}
          </p>
          <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            {character.personality}
          </p>
          <div className="flex gap-2 mt-3">
            <span
              className="meta px-[6px] py-[2px] border rounded-[2px]"
              style={{ fontSize: '9px', borderColor: 'var(--color-fog)' }}
            >
              {character.communicationStyle.toUpperCase()}
            </span>
            <span
              className="meta px-[6px] py-[2px] border rounded-[2px]"
              style={{ fontSize: '9px', borderColor: 'var(--color-fog)' }}
            >
              {character.accent.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
