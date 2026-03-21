'use client';

import { PageHeader } from '@/components/studio/PageHeader';
import { ComposingStudio } from '@/components/studio/ComposingStudio';

export default function CreatePage() {
  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <PageHeader />
      <ComposingStudio />
    </div>
  );
}
