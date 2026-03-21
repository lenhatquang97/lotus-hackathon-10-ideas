'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { KnowledgeItem } from '@/lib/types';
import { FileDropZone } from './FileDropZone';

interface KnowledgeZoneProps {
  items: KnowledgeItem[];
  onAdd: (item: KnowledgeItem) => void;
  onRemove: (id: string) => void;
}

export function KnowledgeZone({ items, onAdd, onRemove }: KnowledgeZoneProps) {
  const [urlInput, setUrlInput] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      onAdd({
        id: uuid(),
        type: 'file',
        name: file.name,
        content: '',
        status: 'ready',
        meta: { fileName: file.name, fileSize: file.size, fileType: file.type },
      });
    });
  };

  const handleUrl = () => {
    if (!urlInput.trim()) return;
    onAdd({
      id: uuid(),
      type: 'url',
      name: urlInput.trim().length > 40 ? urlInput.trim().slice(0, 40) + '...' : urlInput.trim(),
      content: urlInput.trim(),
      status: 'ready',
      meta: { url: urlInput.trim() },
    });
    setUrlInput('');
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    onAdd({
      id: uuid(),
      type: 'text',
      name: pasteText.trim().slice(0, 40) + (pasteText.trim().length > 40 ? '...' : ''),
      content: pasteText.trim(),
      status: 'ready',
    });
    setPasteText('');
    setPasteOpen(false);
  };

  return (
    <div className="knowledge-zone">
      {/* Zone label */}
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[var(--color-fog)]">
        <span className="font-ui text-[10px] tracking-[0.14em] uppercase" style={{ color: 'var(--color-ash)' }}>
          Knowledge
        </span>
        <span className="font-body text-[12px] transition-colors duration-[220ms]" style={{ color: 'var(--color-ash)' }}>
          Files, URLs, or text
        </span>
      </div>

      {/* File drop */}
      <FileDropZone onDrop={handleFiles} />

      {/* URL input */}
      <div className="flex gap-2 mb-4">
        <input
          type="url"
          className="flex-1 font-body text-[13px] bg-[var(--color-surface)] border border-[var(--color-fog)] rounded-[2px] py-[9px] px-3 outline-none transition-colors duration-[220ms] focus:border-[var(--color-ash)]"
          style={{ color: 'var(--color-ink)' }}
          placeholder="Paste a URL..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleUrl(); }}
        />
        <button
          className="font-ui text-[10px] tracking-[0.10em] uppercase py-[9px] px-[14px] bg-[var(--color-ink)] text-white border-none rounded-[2px] cursor-pointer transition-opacity duration-[220ms] disabled:opacity-30 disabled:cursor-default hover:not-disabled:opacity-[0.82]"
          disabled={!urlInput.trim()}
          onClick={handleUrl}
        >
          Add
        </button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-1 mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-2 px-[10px] bg-[var(--color-surface)] border border-[var(--color-fog)] rounded-[2px] transition-colors duration-[220ms] hover:border-[var(--color-ash)]"
            >
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span
                  className="font-ui text-[9px] tracking-[0.10em] uppercase border rounded-[2px] px-[6px] py-[2px] shrink-0 whitespace-nowrap"
                  style={{ color: 'var(--color-ash)', borderColor: 'var(--color-fog)' }}
                >
                  {item.type}
                </span>
                <span
                  className="font-body text-[12px] whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ color: 'var(--color-ink)' }}
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>
              <span
                className={`font-ui text-[9px] tracking-[0.08em] uppercase shrink-0 ${
                  item.status === 'ready' ? '' : 'animate-blink'
                }`}
                style={{ color: item.status === 'ready' ? 'var(--color-ink)' : 'var(--color-ash)' }}
              >
                {item.status}
              </span>
              <button
                className="bg-transparent border-none text-[16px] cursor-pointer p-0 px-[2px] leading-none transition-colors duration-[220ms] hover:text-[var(--color-ink)]"
                style={{ color: 'var(--color-fog)' }}
                onClick={() => onRemove(item.id)}
                aria-label="Remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Paste text toggle */}
      <div>
        <button
          className="bg-transparent border-none font-ui text-[10px] tracking-[0.10em] uppercase underline underline-offset-[3px] cursor-pointer p-0 transition-colors duration-[220ms] hover:text-[var(--color-ink)]"
          style={{ color: 'var(--color-ash)' }}
          onClick={() => setPasteOpen(!pasteOpen)}
        >
          {pasteOpen ? '− Hide text input' : '+ Paste raw text'}
        </button>
        {pasteOpen && (
          <div className="mt-3 flex flex-col gap-2 animate-fade-up">
            <textarea
              className="font-body text-[13px] bg-[var(--color-surface)] border border-[var(--color-fog)] rounded-[2px] p-3 outline-none resize-y leading-relaxed transition-colors duration-[220ms] focus:border-[var(--color-ash)]"
              style={{ color: 'var(--color-ink)' }}
              placeholder="Paste any text — meeting notes, job descriptions, company policy..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={5}
            />
            <button
              className="self-end font-ui text-[10px] tracking-[0.10em] uppercase py-2 px-4 bg-[var(--color-ink)] text-white border-none rounded-[2px] cursor-pointer transition-opacity duration-[220ms] disabled:opacity-30 disabled:cursor-default hover:not-disabled:opacity-[0.82]"
              disabled={!pasteText.trim()}
              onClick={handlePaste}
            >
              Add text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
