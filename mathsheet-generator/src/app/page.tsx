'use client';

import { useState, useCallback, useEffect } from 'react';
import { SeedInitializer } from '@/components/SeedInitializer';
import { Dashboard } from '@/components/Dashboard';
import { WorksheetView } from '@/components/WorksheetView';
import { PracticeMode } from '@/components/PracticeMode';
import { useAppStore } from '@/store';
import { generateWorksheet } from '@/lib/generator';
import { SEED_QUESTIONS } from '@/lib/seed/questions';
import type { Question } from '@/types';

export default function Home() {
  const [ready, setReady] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const {
    config,
    currentWorksheet,
    setWorksheet,
    addToHistory,
    practiceMode,
    setPracticeMode,
  } = useAppStore();

  const handleReady = useCallback((count: number) => {
    setQuestionCount(count);
    setQuestions(SEED_QUESTIONS);
    setReady(true);
  }, []);

  // Listen for generate event from Dashboard
  useEffect(() => {
    function handleGenerate() {
      if (questions.length === 0) return;
      const ws = generateWorksheet(questions, config);
      setWorksheet(ws);
      addToHistory(ws);
    }
    window.addEventListener('generate-worksheet', handleGenerate);
    return () => window.removeEventListener('generate-worksheet', handleGenerate);
  }, [questions, config, setWorksheet, addToHistory]);

  if (!ready) {
    return <SeedInitializer onReady={handleReady} />;
  }

  // Practice mode
  if (practiceMode) {
    return <PracticeMode questions={questions} />;
  }

  // Worksheet view
  if (currentWorksheet) {
    return <WorksheetView worksheet={currentWorksheet} />;
  }

  // Dashboard
  return (
    <div>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-md no-print">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🧮</span>
            <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-headline)' }}>
              MathSheet Generator
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Quick Practice
            </button>
            <button
              onClick={() => {
                const html = document.documentElement;
                const hasDark = html.classList.contains('dark');
                const hasLight = html.classList.contains('light');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                // Cycle: system → force dark → force light → back to system
                if (!hasDark && !hasLight) {
                  // System is active; override to opposite of system
                  html.classList.add(systemDark ? 'light' : 'dark');
                } else if (hasDark) {
                  html.classList.remove('dark');
                  html.classList.add('light');
                } else {
                  html.classList.remove('light');
                  // Back to system-controlled
                }
              }}
              className="w-8 h-8 rounded-lg border border-[var(--border-default)] flex items-center justify-center text-sm hover:border-[var(--accent-primary)]"
              title="Toggle dark mode"
            >
              🌓
            </button>
          </div>
        </div>
      </header>

      <main>
        <Dashboard questionCount={questionCount} />
      </main>
    </div>
  );
}
