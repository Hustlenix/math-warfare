'use client';

import { useMemo } from 'react';
import { CBSE_CHAPTERS } from '@/types';
import type { Difficulty } from '@/types';
import { KaTeX } from '@/components/KaTeX';
import { useAppStore } from '@/store';

const CHAPTER_ICONS: Record<string, string> = {
  'Real Numbers': '📐',
  'Polynomials': '📊',
  'Pair of Linear Equations in Two Variables': '⚖️',
  'Quadratic Equations': '🔢',
  'Arithmetic Progressions': '📈',
  'Triangles': '△',
  'Coordinate Geometry': '📍',
  'Introduction to Trigonometry': '📐',
  'Some Applications of Trigonometry': '🏗️',
  'Circles': '⭕',
  'Areas Related to Circles': '🔵',
  'Surface Areas and Volumes': '📦',
  'Statistics': '📊',
  'Probability': '🎲',
};

export function Dashboard({ questionCount }: { questionCount: number }) {
  const { config, setConfig, setPracticeMode, attempts, getChapterProgress } = useAppStore();

  const chapters = useMemo(() => CBSE_CHAPTERS.map((ch) => ({
    name: ch,
    icon: CHAPTER_ICONS[ch] || '📖',
    selected: config.chapters.includes(ch),
  })), [config.chapters]);

  const chapterProgress = useMemo(
    () =>
      CBSE_CHAPTERS
        .map((chapter) => ({ chapter, ...getChapterProgress(chapter) }))
        .filter((p) => p.attempted > 0),
    [attempts, getChapterProgress]
  );

  function toggleChapter(ch: string) {
    const current = config.chapters;
    const next = current.includes(ch)
      ? current.filter((c) => c !== ch)
      : [...current, ch];
    setConfig({ chapters: next });
  }

  function selectAll() {
    setConfig({ chapters: [...CBSE_CHAPTERS] });
  }

  function clearAll() {
    setConfig({ chapters: [] });
  }

  const totalSelectedMarks = 20; // default
  const timeMinutes = Math.ceil(totalSelectedMarks * 1.5);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-12">
        <h1
          className="text-4xl font-bold tracking-tight mb-3"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          MathSheet Generator
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          Practice worksheets from 25 years of Indian Class 10 board papers.
          Every question is mathematically verified. Same config + same seed = same worksheet.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
          <div className="text-2xl font-bold">{questionCount}</div>
          <div className="text-sm text-[var(--text-secondary)]">Questions in bank</div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
          <div className="text-2xl font-bold">{CBSE_CHAPTERS.length}</div>
          <div className="text-sm text-[var(--text-secondary)]">Chapters covered</div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
          <div className="text-2xl font-bold">3</div>
          <div className="text-sm text-[var(--text-secondary)]">Difficulty levels</div>
        </div>
      </div>

      {/* Progress per chapter */}
      {chapterProgress.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-headline)' }}>
              Your Progress
            </h2>
            <span className="text-xs text-[var(--text-secondary)]">
              Self-reported accuracy in Quick Practice
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chapterProgress.map((p) => (
              <div
                key={p.chapter}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{p.chapter}</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {p.correct}/{p.attempted} · {p.accuracy}% accuracy
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-success)]"
                    style={{ width: `${Math.max(p.accuracy, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chapter selector */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-headline)' }}>
            Select Chapters
          </h2>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-sm text-[var(--accent-primary)] hover:underline">
              Select all
            </button>
            <span className="text-[var(--text-tertiary)]">·</span>
            <button onClick={clearAll} className="text-sm text-[var(--accent-primary)] hover:underline">
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {chapters.map((ch) => (
            <button
              key={ch.name}
              onClick={() => toggleChapter(ch.name)}
              className={`
                flex items-center gap-3 p-4 rounded-xl border text-left transition-all
                ${ch.selected
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-math)] shadow-md'
                  : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)] hover:shadow-sm'
                }
              `}
            >
              <span className="text-xl">{ch.icon}</span>
              <span className="text-sm font-medium leading-tight">{ch.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Difficulty + Count */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
            Difficulty
          </h3>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard', 'mixed'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setConfig({ difficulty: d })}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${config.difficulty === d
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                  }
                `}
              >
                {d === 'mixed' ? 'Mixed' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
            Number of Questions
          </h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={config.questionCount}
              onChange={(e) => setConfig({ questionCount: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-lg font-bold w-12 text-right">{config.questionCount}</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            ~{timeMinutes} min estimated
          </p>
        </div>
      </section>

      {/* Generate button */}
      <section className="text-center">
        <button
          onClick={() => {
            setConfig({ seed: Math.floor(Math.random() * 1000000) });
            setPracticeMode(false);
            // Parent handles generation
            window.dispatchEvent(new CustomEvent('generate-worksheet'));
          }}
          disabled={config.chapters.length === 0}
          className={`
            px-8 py-4 rounded-xl text-lg font-semibold transition-all
            ${config.chapters.length > 0
              ? 'bg-[var(--accent-primary)] text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
            }
          `}
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Generate Worksheet →
        </button>
        <p className="text-xs text-[var(--text-tertiary)] mt-2">
          Seed: {config.seed} · {config.difficulty === 'mixed' ? 'All difficulties' : config.difficulty}
        </p>
      </section>
    </div>
  );
}
