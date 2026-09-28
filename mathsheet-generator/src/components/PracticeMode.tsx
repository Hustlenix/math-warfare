'use client';

import { useState, useCallback } from 'react';
import { KaTeX } from '@/components/KaTeX';
import type { Question, Attempt } from '@/types';
import { useAppStore } from '@/store';
import { mulberry32, shuffle } from '@/lib/generator';

interface PracticeSession {
  chapter: string;
  questions: Question[];
  currentIndex: number;
  answers: Map<number, string>;
  marks: Map<number, boolean>;
  submitted: boolean;
  startedAt: number;
}

export function PracticeMode({ questions }: { questions: Question[] }) {
  const { setPracticeMode, addAttempt } = useAppStore();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  const chapters = [...new Set(questions.map((q) => q.chapter))].sort();

  const startSession = useCallback((chapter: string) => {
    const pool = questions.filter((q) => q.chapter === chapter);
    // Deterministic pick of 10 questions (stable for a given chapter)
    const rng = mulberry32(chapter.split('').reduce((a, c) => a * 31 + c.charCodeAt(0) & 0xffffffff, 7));
    const shuffled = shuffle(pool, rng);
    const selected = shuffled.slice(0, 10);

    setSession({
      chapter,
      questions: selected,
      currentIndex: 0,
      answers: new Map(),
      marks: new Map(),
      submitted: false,
      startedAt: Date.now(),
    });
    setShowResult(false);
    setCompleted(false);
  }, [questions]);

  const finishSession = useCallback(() => {
    if (!session) return;
    const answers = session.questions.map((q, i) => ({
      questionId: q.id,
      studentAnswer: session.answers.get(i) ?? '',
      isCorrect: session.marks.get(i) ?? false,
      timeTakenSeconds: 0,
    }));
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalMarks = session.questions.reduce((sum, q) => sum + q.marks, 0);
    const obtainedMarks = session.questions.reduce(
      (sum, q, i) => sum + (session.marks.get(i) ? q.marks : 0),
      0
    );
    const attempt: Attempt = {
      id: `practice-${session.chapter}-${Date.now()}`,
      worksheetId: `practice-${session.chapter}`,
      answers,
      totalMarks,
      obtainedMarks,
      accuracy: answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0,
      timeTakenSeconds: Math.round((Date.now() - session.startedAt) / 1000),
      startedAt: new Date(session.startedAt).toISOString(),
      completedAt: new Date().toISOString(),
    };
    addAttempt(attempt);
    setCompleted(true);
  }, [session, addAttempt]);

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => setPracticeMode(false)}
          className="text-sm text-[var(--accent-primary)] hover:underline mb-6 inline-block"
        >
          ← Back to Generator
        </button>
        <h1
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Quick Practice
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Choose a chapter to practice. Each session has 10 questions.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {chapters.map((ch) => (
            <button
              key={ch}
              onClick={() => startSession(ch)}
              className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-left hover:border-[var(--accent-primary)] hover:shadow-md transition-all"
            >
              <span className="text-sm font-medium">{ch}</span>
              <span className="block text-xs text-[var(--text-tertiary)] mt-1">
                {questions.filter((q) => q.chapter === ch).length} questions
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const mark = (index: number, isCorrect: boolean) => {
    const newMarks = new Map(session.marks);
    newMarks.set(index, isCorrect);
    setSession({ ...session, marks: newMarks });
  };

  if (completed) {
    const correctCount = session.questions.filter((_, i) => session.marks.get(i)).length;
    const accuracy = session.questions.length > 0
      ? Math.round((correctCount / session.questions.length) * 100)
      : 0;
    const minutes = Math.round((Date.now() - session.startedAt) / 60000);
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          Session Complete
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {session.chapter} · {session.questions.length} questions
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
            <div className="text-2xl font-bold">{correctCount}</div>
            <div className="text-sm text-[var(--text-secondary)]">Correct</div>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-sm text-[var(--text-secondary)]">Accuracy</div>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5">
            <div className="text-2xl font-bold">{minutes}m</div>
            <div className="text-sm text-[var(--text-secondary)]">Time</div>
          </div>
        </div>

        <div className="space-y-2 mb-10">
          {session.questions.map((q, i) => {
            const marked = session.marks.get(i);
            return (
              <div
                key={q.id}
                className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
              >
                <span className="text-sm mt-0.5">{marked === true ? '✅' : marked === false ? '❌' : '⬜'}</span>
                <div className="text-sm flex-1">
                  <KaTeX latex={q.questionLatex} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setSession(null); setCompleted(false); }}
            className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm"
          >
            ← Practice another chapter
          </button>
          <button
            onClick={() => setPracticeMode(false)}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm"
          >
            ← Back to Generator
          </button>
        </div>
      </div>
    );
  }

  const q = session.questions[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Back button */}
      <button
        onClick={() => setSession(null)}
        className="text-sm text-[var(--accent-primary)] hover:underline mb-6 inline-block"
      >
        ← Change chapter
      </button>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
          <span>{session.chapter}</span>
          <span>
            Question {session.currentIndex + 1} of {session.questions.length}
          </span>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-[var(--text-tertiary)]">
            {q.difficulty}
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
          </span>
        </div>
        <div className="text-lg leading-relaxed mb-6">
          <KaTeX latex={q.questionLatex} />
        </div>

        {/* Answer input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Your Answer
          </label>
          <textarea
            value={session.answers.get(session.currentIndex) ?? ''}
            onChange={(e) => {
              const newAnswers = new Map(session.answers);
              newAnswers.set(session.currentIndex, e.target.value);
              setSession({ ...session, answers: newAnswers });
            }}
            placeholder="Type your answer here... (LaTeX supported)"
            className="w-full p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--shadow-focus)] resize-none"
            rows={3}
          />
        </div>

        {/* Show solution toggle */}
        {showResult && q.solution && (
          <div className="mt-6 p-4 rounded-lg bg-[var(--surface-formula)] border border-purple-100">
            <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">
              Solution
            </h4>
            <div className="space-y-2">
              {q.solution.steps.map((step, si) => (
                <div key={si} className="flex gap-2">
                  <span className="text-xs text-[var(--text-tertiary)] mt-1">{si + 1}.</span>
                  <div className="text-sm">
                    <KaTeX latex={step} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <span className="text-xs font-semibold text-purple-700">Answer: </span>
              <KaTeX latex={q.solution.answerLatex} />
            </div>
          </div>
        )}

        {/* Self-marking — record whether you got it right */}
        {showResult && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Did you get it right?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => mark(session.currentIndex, true)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  session.marks.get(session.currentIndex) === true
                    ? 'bg-[var(--accent-success)] text-white'
                    : 'border border-[var(--border-default)] hover:border-[var(--accent-success)]'
                }`}
              >
                ✓ I got it right
              </button>
              <button
                onClick={() => mark(session.currentIndex, false)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  session.marks.get(session.currentIndex) === false
                    ? 'bg-red-500 text-white'
                    : 'border border-[var(--border-default)] hover:border-red-400'
                }`}
              >
                ✗ I got it wrong
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setShowResult(false);
            setSession({
              ...session,
              currentIndex: Math.max(0, session.currentIndex - 1),
            });
          }}
          disabled={session.currentIndex === 0}
          className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm disabled:opacity-30"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setShowResult(!showResult)}
            className="px-4 py-2 rounded-lg border border-[var(--accent-secondary)] text-[var(--accent-secondary)] text-sm hover:bg-purple-50"
          >
            {showResult ? 'Hide Solution' : 'Show Solution'}
          </button>

          {session.currentIndex < session.questions.length - 1 ? (
            <button
              onClick={() => {
                setShowResult(false);
                setSession({
                  ...session,
                  currentIndex: session.currentIndex + 1,
                });
              }}
              className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={finishSession}
              className="px-4 py-2 rounded-lg bg-[var(--accent-success)] text-white text-sm hover:bg-green-700"
            >
              Finish Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
