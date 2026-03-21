'use client';

import Link from 'next/link';

export function PageHeader() {
  return (
    <header>
      {/* Nav */}
      <nav
        className="h-14 border-b px-12 max-md:px-6 flex items-center justify-between"
        style={{ borderColor: 'var(--color-fog)' }}
      >
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

      {/* Page title */}
      <div className="max-w-[960px] mx-auto px-12 max-md:px-6 pt-12 pb-9 border-b" style={{ borderColor: 'var(--color-fog)' }}>
        <Link
          href="/"
          className="font-ui text-[11px] tracking-[0.10em] uppercase block mb-5 no-underline transition-colors duration-[220ms] hover:text-[var(--color-ink)]"
          style={{ color: 'var(--color-ash)' }}
        >
          &larr; Studio
        </Link>
        <h1 className="font-display font-light text-[42px] leading-[1.1] mb-[10px]" style={{ color: 'var(--color-ink)' }}>
          Create World
        </h1>
        <p className="font-body text-[14px]" style={{ color: 'var(--color-ash)' }}>
          Drop materials, describe your scenario, generate.
        </p>
      </div>
    </header>
  );
}
