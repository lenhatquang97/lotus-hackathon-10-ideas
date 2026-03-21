'use client';

import { useRef, useState } from 'react';

interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
}

export function FileDropZone({ onDrop }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onDrop(files);
  };

  return (
    <div
      className={`border border-dashed rounded-[2px] py-7 px-4 text-center cursor-pointer transition-all duration-[220ms] mb-4 ${
        isDragging
          ? 'border-[var(--color-ink)] bg-[rgba(10,10,10,0.03)]'
          : 'border-[var(--color-fog)] hover:border-[var(--color-ash)] hover:bg-[rgba(10,10,10,0.02)]'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onDrop(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
      <div>
        <svg
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          className={`mx-auto mb-3 transition-colors duration-[220ms] ${
            isDragging ? 'text-[var(--color-ash)]' : 'text-[var(--color-fog)]'
          }`}
        >
          <path d="M3 1h10l6 6v16H3V1z" stroke="currentColor" strokeWidth="1" />
          <path d="M13 1v6h6" stroke="currentColor" strokeWidth="1" />
          <line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1" />
          <line x1="6" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1" />
        </svg>
        <p className="font-body text-[13px] mb-1" style={{ color: 'var(--color-ash)' }}>
          Drop files here
        </p>
        <p
          className="font-ui text-[10px] uppercase tracking-[0.06em]"
          style={{ color: 'var(--color-ash)' }}
        >
          PDF, DOCX, TXT — or click to browse
        </p>
      </div>
    </div>
  );
}
