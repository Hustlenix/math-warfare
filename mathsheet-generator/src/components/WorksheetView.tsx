'use client';

import { KaTeX } from '@/components/KaTeX';
import type { Worksheet } from '@/types';
import { useAppStore } from '@/store';

export function WorksheetView({ worksheet }: { worksheet: Worksheet }) {
  const { showSolutions, toggleSolutions, setWorksheet } = useAppStore();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => setWorksheet(null)}
            className="text-sm text-[var(--accent-primary)] hover:underline mb-2 inline-block"
          >
            ← Back to Generator
          </button>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {worksheet.name}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {worksheet.questions.length} questions · {worksheet.totalMarks} marks ·{' '}
            {worksheet.timeMinutes} minutes · Seed: {worksheet.config.seed}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={toggleSolutions}
            className="px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm hover:border-[var(--accent-primary)]"
          >
            {showSolutions ? 'Hide Solutions' : 'Show Solutions'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm hover:bg-blue-700"
          >
            Print / PDF
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {worksheet.questions.map((wq, idx) => (
          <div
            key={wq.question.id}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6"
          >
            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--surface-math)] flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">
                    {wq.question.chapter}
                  </span>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {wq.question.marks} {wq.question.marks === 1 ? 'mark' : 'marks'}
                  </span>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    wq.question.difficulty === 'easy'
                      ? 'bg-emerald-50 text-emerald-700'
                      : wq.question.difficulty === 'medium'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {wq.question.difficulty}
                  </span>
                </div>
                <div className="text-lg leading-relaxed">
                  <KaTeX latex={wq.question.questionLatex} />
                </div>
              </div>
            </div>

            {/* Solution */}
            {showSolutions && wq.question.solution && (
              <div className="mt-4 ml-11 p-4 rounded-lg bg-[var(--surface-formula)] border border-purple-100">
                <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">
                  Solution
                </h4>
                <div className="space-y-2">
                  {wq.question.solution.steps.map((step, si) => (
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
                  <KaTeX latex={wq.question.solution.answerLatex} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
