import { useState } from 'react';
import type { KnowledgeItem } from '../../lib/brief-analyzer';
import { FileDropZone } from './FileDropZone';

let nextId = 1;
function genId() { return `ki-${nextId++}-${Date.now()}`; }

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
        id: genId(), type: 'file', name: file.name, content: '', status: 'ready',
        meta: { fileName: file.name, fileSize: file.size, fileType: file.type },
      });
    });
  };

  const handleUrl = () => {
    if (!urlInput.trim()) return;
    onAdd({
      id: genId(), type: 'url',
      name: urlInput.trim().length > 40 ? urlInput.trim().slice(0, 40) + '...' : urlInput.trim(),
      content: urlInput.trim(), status: 'ready', meta: { url: urlInput.trim() },
    });
    setUrlInput('');
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    onAdd({
      id: genId(), type: 'text',
      name: pasteText.trim().slice(0, 40) + (pasteText.trim().length > 40 ? '...' : ''),
      content: pasteText.trim(), status: 'ready',
    });
    setPasteText('');
    setPasteOpen(false);
  };

  return (
    <div>
      {/* Zone label */}
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="font-ui text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>Knowledge</span>
        <span className="font-body text-xs" style={{ color: 'var(--color-text-secondary)' }}>Files, URLs, or text</span>
      </div>

      <FileDropZone onDrop={handleFiles} />

      {/* URL input */}
      <div className="flex gap-2 mb-4">
        <input
          type="url" className="flex-1 font-body text-sm border py-2 px-3 outline-none transition-colors duration-200"
          style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '2px' }}
          placeholder="Paste a URL..."
          value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleUrl(); }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-text-secondary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
        />
        <button
          className="font-ui text-[10px] tracking-widest uppercase py-2 px-3 border-none cursor-pointer transition-opacity duration-200"
          style={{ backgroundColor: 'var(--color-accent)', color: '#0D0B14', borderRadius: '2px', opacity: urlInput.trim() ? 1 : 0.3 }}
          disabled={!urlInput.trim()} onClick={handleUrl}
        >Add</button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-1 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-2 px-2 border transition-colors duration-200"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '2px' }}>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="font-ui text-[9px] tracking-widest uppercase border px-1.5 py-0.5 shrink-0"
                  style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', borderRadius: '2px' }}>{item.type}</span>
                <span className="font-body text-xs whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: 'var(--color-text-primary)' }} title={item.name}>{item.name}</span>
              </div>
              <span className={`font-ui text-[9px] tracking-wide uppercase shrink-0 ${item.status === 'ready' ? '' : 'animate-blink'}`}
                style={{ color: item.status === 'ready' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{item.status}</span>
              <button className="bg-transparent border-none text-base cursor-pointer p-0 px-0.5 leading-none transition-colors duration-200"
                style={{ color: 'var(--color-border)' }} onClick={() => onRemove(item.id)} aria-label="Remove"
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-border)')}>&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Paste text */}
      <div>
        <button className="bg-transparent border-none font-ui text-[10px] tracking-widest uppercase underline underline-offset-2 cursor-pointer p-0 transition-colors duration-200"
          style={{ color: 'var(--color-text-secondary)' }} onClick={() => setPasteOpen(!pasteOpen)}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}>
          {pasteOpen ? '− Hide text input' : '+ Paste raw text'}
        </button>
        {pasteOpen && (
          <div className="mt-3 flex flex-col gap-2 animate-fade-up">
            <textarea className="font-body text-sm border p-3 outline-none resize-y leading-relaxed transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '2px' }}
              placeholder="Paste any text — meeting notes, job descriptions, company policy..."
              value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={5}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-text-secondary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')} />
            <button className="self-end font-ui text-[10px] tracking-widest uppercase py-2 px-4 border-none cursor-pointer transition-opacity duration-200"
              style={{ backgroundColor: 'var(--color-accent)', color: '#0D0B14', borderRadius: '2px', opacity: pasteText.trim() ? 1 : 0.3 }}
              disabled={!pasteText.trim()} onClick={handlePaste}>Add text</button>
          </div>
        )}
      </div>
    </div>
  );
}
