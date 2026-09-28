'use client';

import { useEffect, useState } from 'react';
import { SEED_QUESTIONS } from '@/lib/seed/questions';

export function SeedInitializer({ onReady }: { onReady: (count: number) => void }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Simulate a brief load for UX, then hand off
    const timer = setTimeout(() => {
      setReady(true);
      onReady(SEED_QUESTIONS.length);
    }, 300);
    return () => clearTimeout(timer);
  }, [onReady]);

  if (ready) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="mb-4 text-4xl">🧮</div>
        <h2
          className="text-xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Loading MathSheet Generator...
        </h2>
        <p className="text-[var(--text-secondary)]">
          Preparing {SEED_QUESTIONS.length} questions
        </p>
        <div className="mt-4 h-1 w-48 mx-auto rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div className="h-full w-3/4 bg-[var(--accent-primary)] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
