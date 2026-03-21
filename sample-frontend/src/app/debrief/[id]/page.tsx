'use client';

import dynamic from 'next/dynamic';

const DebriefView = dynamic(
  () => import('./DebriefView').then(m => ({ default: m.DebriefView })),
  { ssr: false }
);

export default function DebriefPage() {
  return <DebriefView />;
}
