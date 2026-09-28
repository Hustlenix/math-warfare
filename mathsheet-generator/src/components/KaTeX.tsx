'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

const INLINE_RE = /\$([^$]+?)\$/g;

function renderKaTeX(target: HTMLElement, expression: string, displayMode: boolean) {
  try {
    katex.render(expression, target, {
      displayMode,
      throwOnError: false,
      errorColor: '#DC2626',
      trust: true,
    });
  } catch {
    target.textContent = expression;
  }
}

/**
 * Render `latex` which may be prose plus inline `$...$` math.
 * Prose → text nodes; math → KaTeX spans. Supports both inline and display
 * blocks inside the string.
 */
function renderMixed(target: HTMLElement, latex: string, defaultDisplay: boolean) {
  target.innerHTML = '';
  const parts: Array<{ isMath: boolean; value: string; display: boolean }> = [];
  let lastIndex = 0;
  const re = new RegExp(INLINE_RE.source, 'g');

  // Detect display blocks $$...$$ first and preserve them as math.
  // For simplicity, treat $$...$$ and $...$ the same as inline math here.
  let m: RegExpExecArray | null;
  while ((m = re.exec(latex))) {
    if (m.index > lastIndex) {
      parts.push({ isMath: false, value: latex.slice(lastIndex, m.index), display: false });
    }
    const isDisplay = m[0].startsWith('$$');
    parts.push({ isMath: true, value: isDisplay ? m[1].trim() : m[1], display: defaultDisplay || isDisplay });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < latex.length) {
    parts.push({ isMath: false, value: latex.slice(lastIndex), display: false });
  }

  for (const part of parts) {
    if (part.isMath) {
      const span = document.createElement('span');
      renderKaTeX(span, part.value, part.display);
      target.appendChild(span);
    } else {
      target.appendChild(document.createTextNode(part.value));
    }
  }
}

interface KaTeXProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Math renderer that accepts prose mixed with inline `$...$` (and `$$...$$`)
 * math. Default inline; set `displayMode` to treat the whole thing as math.
 */
export function KaTeX({ latex, displayMode = false, className = '' }: KaTeXProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (displayMode) {
        // Pure display expression (no delimiters expected): render whole thing.
        const trimmed = latex.trim().replace(/^\$\$/, '').replace(/\$\$$/, '').replace(/^\$/, '').replace(/\$$/, '');
        renderKaTeX(ref.current, trimmed, true);
      } else {
        renderMixed(ref.current, latex, false);
      }
    }
  }, [latex, displayMode]);

  return <span ref={ref} className={className} />;
}

interface LaTeXBlockProps {
  latex: string;
  className?: string;
}

/**
 * Display (block) math renderer for standalone formulas / answers.
 */
export function LaTeXBlock({ latex, className = '' }: LaTeXBlockProps) {
  return (
    <div className={`my-4 p-4 rounded-lg bg-[var(--surface-math)] ${className}`}>
      <KaTeX latex={latex} displayMode />
    </div>
  );
}
