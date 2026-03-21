'use client';

import Link from 'next/link';
import { WorldGrid } from '@/components/catalog/WorldGrid';

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Nav */}
      <nav className="h-14 border-b border-[var(--color-fog)] px-12 max-md:px-6 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-paper)' }}>
        <Link href="/" className="font-display italic text-xl" style={{ color: 'var(--color-ink)' }}>
          LotusHack
        </Link>
        <Link
          href="/create"
          className="font-body text-[13px] px-5 py-2 border border-[var(--color-ink)] transition-all duration-200 hover:bg-[var(--color-ink)] hover:text-white"
          style={{ color: 'var(--color-ink)' }}
        >
          + Create World
        </Link>
      </nav>

      {/* Hero — asymmetric two-column */}
      <section className="max-w-[1200px] mx-auto px-12 max-md:px-6 pt-24 pb-18 max-md:pt-12 max-md:pb-12">
        <div className="grid grid-cols-[1fr_0.65fr] max-md:grid-cols-1 gap-12 items-end">
          {/* Left column */}
          <div>
            <h1 className="font-display font-normal leading-[1.05] tracking-tight mb-10 max-md:mb-6"
              style={{ color: 'var(--color-ink)' }}>
              <span className="block text-[96px] max-lg:text-[64px] max-md:text-[48px] animate-hero-1">
                Don&apos;t study English.
              </span>
              <span className="block text-[96px] max-lg:text-[64px] max-md:text-[48px] italic animate-hero-2">
                Inhabit it.
              </span>
            </h1>
            <div className="flex items-center gap-8 animate-hero-4">
              <Link
                href="#worlds"
                className="font-body text-[13px] uppercase tracking-[0.1em] px-8 py-3.5 bg-[var(--color-ink)] text-white transition-opacity duration-200 hover:opacity-85"
              >
                Explore Worlds
              </Link>
              <Link
                href="/create"
                className="font-body text-[13px] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--color-ash)]"
                style={{ color: 'var(--color-ink)' }}
              >
                Build Your Own
              </Link>
            </div>
          </div>

          {/* Right column — subtitle, bottom-aligned */}
          <div className="self-end max-md:mt-0 animate-hero-3">
            <p className="font-body text-[15px] leading-relaxed max-w-[340px]"
              style={{ color: 'var(--color-ash)' }}>
              Enter immersive worlds with AI conversation partners. Practice real scenarios — job interviews, social encounters, daily life — and get instant feedback on how you actually sound.
            </p>
          </div>
        </div>
      </section>

      {/* World Catalog */}
      <section id="worlds" className="max-w-[1200px] mx-auto px-12 max-md:px-6 pb-24">
        <h2 className="meta mb-8" style={{ fontSize: '13px', letterSpacing: '0.15em' }}>
          Available Worlds
        </h2>
        <WorldGrid />
      </section>
    </div>
  );
}
