'use client';

import dynamic from 'next/dynamic';

const WorldSession = dynamic(
  () => import('./WorldSession').then(m => ({ default: m.WorldSession })),
  { ssr: false }
);

export default function WorldSessionPage() {
  return <WorldSession />;
}
