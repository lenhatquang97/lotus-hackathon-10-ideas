'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorldStore } from '@/store/world-store';
import type { World } from '@/lib/types';

export default function CreatePage() {
  const router = useRouter();
  const { addWorld } = useWorldStore();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<World | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    setGenerated(null);

    try {
      const res = await fetch('/api/generate-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('Failed to generate world');
      const world = await res.json();
      setGenerated(world);
    } catch {
      setError('Failed to generate world. Check your API key and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generated) return;
    addWorld(generated);
    router.push('/');
  };

  return (
    <div className="flex-1" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Nav */}
      <nav className="h-14 border-b border-[var(--color-fog)] px-12 max-md:px-6 flex items-center justify-between">
        <Link href="/" className="font-display italic text-xl" style={{ color: 'var(--color-ink)' }}>
          LotusHack
        </Link>
        <Link
          href="/"
          className="font-body text-[13px] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--color-ash)]"
          style={{ color: 'var(--color-ink)' }}
        >
          Back to Worlds
        </Link>
      </nav>

      <div className="max-w-[800px] mx-auto px-12 max-md:px-6 py-16">
        {/* Header */}
        <h1 className="font-display text-[48px] max-md:text-[36px] font-normal leading-[1.1] mb-3" style={{ color: 'var(--color-ink)' }}>
          Creator Studio
        </h1>
        <p className="font-body text-[15px] mb-12" style={{ color: 'var(--color-ash)' }}>
          Describe a scenario and our AI will build a complete practice world with unique conversation partners.
        </p>

        {/* Prompt Input */}
        <div className="mb-12">
          <label className="meta block mb-3" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>
            Describe Your World
          </label>
          <textarea
            placeholder="e.g., A job interview at a tech startup in Singapore. The VP of Engineering is skeptical about your experience but the HR manager is supportive."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 font-body text-[14px] leading-relaxed resize-none border border-[var(--color-fog)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-ink)] transition-colors duration-200"
            style={{ color: 'var(--color-ink)' }}
          />
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="font-body text-[13px] uppercase tracking-[0.1em] px-8 py-3.5 bg-[var(--color-ink)] text-white transition-opacity duration-200 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate World'}
            </button>
          </div>
          {error && (
            <p className="font-body text-[13px] mt-3" style={{ color: 'var(--color-ink)' }}>{error}</p>
          )}
        </div>

        {/* Quick Prompts */}
        {!generated && (
          <div className="mb-12">
            <p className="meta mb-4" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>
              Suggestions
            </p>
            <div className="space-y-2">
              {[
                'A heated debate about remote work at a marketing agency team meeting',
                'Checking into a hotel where they lost your reservation',
                'First day at a new job — meeting your team over lunch',
                'Negotiating rent with a difficult landlord who wants to raise the price',
                'A university study group preparing for a final exam',
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="block w-full text-left font-body text-[13px] py-2.5 px-4 border border-[var(--color-fog)] bg-[var(--color-surface)] transition-all duration-200 hover:bg-[var(--color-ink)] hover:text-white hover:border-[var(--color-ink)] cursor-pointer"
                  style={{ color: 'var(--color-ash)' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generated World Preview */}
        {generated && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-fog)] animate-fade-up">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-baseline justify-between mb-2">
                <span className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
                  {generated.domain.toUpperCase()}
                </span>
                <span className="meta" style={{ fontSize: '10px' }}>
                  {generated.cefrLevel} &middot; {generated.duration} MIN
                </span>
              </div>
              <div className="h-px my-4" style={{ backgroundColor: 'var(--color-fog)' }} />

              <h2 className="font-display text-[28px] font-semibold leading-[1.2] mb-3" style={{ color: 'var(--color-ink)' }}>
                {generated.title}
              </h2>
              <p className="font-body text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-ash)' }}>
                {generated.description}
              </p>

              {/* Scenario */}
              <div className="mb-6">
                <h3 className="meta mb-2" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>Scenario</h3>
                <p className="font-body text-[14px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                  {generated.scenarioContext}
                </p>
              </div>

              {/* Conversation Arc */}
              <div className="mb-6">
                <h3 className="meta mb-2" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>Conversation Arc</h3>
                <ol className="space-y-1.5">
                  {generated.conversationBeats.map((beat, i) => (
                    <li key={i} className="font-body text-[13px] flex gap-2" style={{ color: 'var(--color-ash)' }}>
                      <span className="meta flex-shrink-0" style={{ fontSize: '10px', marginTop: '2px' }}>{String(i + 1).padStart(2, '0')}</span>
                      {beat}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="h-px my-6" style={{ backgroundColor: 'var(--color-fog)' }} />

              {/* Agents */}
              <h3 className="meta mb-4" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>Conversation Partners</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
                {generated.agents.map((agent) => (
                  <div key={agent.id} className="p-4 bg-[var(--color-surface)]">
                    <div className="flex items-baseline justify-between mb-2">
                      <h4 className="font-display text-[18px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {agent.name}
                      </h4>
                      <span className="meta" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
                        {agent.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="meta mb-2" style={{ fontSize: '10px' }}>
                      {agent.age}YO {agent.nationality.toUpperCase()} &middot; {agent.profession.toUpperCase()}
                    </p>
                    <p className="font-body text-[12px] leading-relaxed mb-2" style={{ color: 'var(--color-ash)' }}>
                      {agent.personality}
                    </p>
                    <div className="flex gap-2">
                      <span className="meta px-1.5 py-0.5 border border-[var(--color-fog)]" style={{ fontSize: '9px' }}>
                        {agent.communicationStyle.toUpperCase()}
                      </span>
                      <span className="meta px-1.5 py-0.5 border border-[var(--color-fog)]" style={{ fontSize: '9px' }}>
                        {agent.accent.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6 mt-8">
                <button
                  onClick={handleSave}
                  className="font-body text-[13px] uppercase tracking-[0.1em] px-8 py-3.5 bg-[var(--color-ink)] text-white transition-opacity duration-200 hover:opacity-85"
                >
                  Save & Publish
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="font-body text-[13px] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--color-ash)] disabled:opacity-40"
                  style={{ color: 'var(--color-ink)' }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
