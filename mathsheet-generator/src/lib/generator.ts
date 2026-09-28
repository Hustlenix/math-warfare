/**
 * Deterministic worksheet generator.
 * Config + seed → reproducible worksheet. No AI, no randomness without seed.
 */
import type { GenerationConfig, Question, Worksheet, WorksheetQuestion } from '@/types';

// Seeded PRNG (Mulberry32)
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle (seeded)
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Given a pool of questions and a config, produce a worksheet.
 */
export function generateWorksheet(
  questions: Question[],
  config: GenerationConfig
): Worksheet {
  const rng = mulberry32(config.seed);

  // 1. Filter by config
  let pool = questions.filter((q) => {
    if (config.chapters.length > 0 && !config.chapters.includes(q.chapter)) return false;
    if (config.difficulty !== 'mixed' && q.difficulty !== config.difficulty) return false;
    if (!config.questionTypes.includes(q.type ?? 'short_answer')) return false;
    return true;
  });

  // 2. Group by chapter
  const byChapter = new Map<string, Question[]>();
  for (const q of pool) {
    const arr = byChapter.get(q.chapter) ?? [];
    arr.push(q);
    byChapter.set(q.chapter, arr);
  }

  // 3. Select questions — balanced across chapters
  const selected: WorksheetQuestion[] = [];
  const chapters = shuffle(Array.from(byChapter.keys()), rng);
  let count = config.questionCount;

  // Round-robin selection across chapters
  let chapterIdx = 0;
  while (selected.length < count && selected.length < pool.length) {
    const chapter = chapters[chapterIdx % chapters.length];
    const available = byChapter.get(chapter) ?? [];
    // Find questions not yet selected
    const selectedIds = new Set(selected.map((s) => s.question.id));
    const remaining = available.filter((q) => !selectedIds.has(q.id));

    if (remaining.length > 0) {
      // Pick one randomly
      const idx = Math.floor(rng() * remaining.length);
      const q = remaining[idx];
      selected.push({ question: q, orderIndex: selected.length });
      count--;
    }

    chapterIdx++;
    // Safety: if we've gone around twice without finding, break
    if (chapterIdx > chapters.length * 2) break;
  }

  // 4. Sort: by chapter, then by difficulty (easy → medium → hard), then by marks
  const diffOrder = { easy: 0, medium: 1, hard: 2 };
  selected.sort((a, b) => {
    const chapterCmp = a.question.chapter.localeCompare(b.question.chapter);
    if (chapterCmp !== 0) return chapterCmp;
    const diffCmp = diffOrder[a.question.difficulty] - diffOrder[b.question.difficulty];
    if (diffCmp !== 0) return diffCmp;
    return a.question.marks - b.question.marks;
  });

  // Re-index
  selected.forEach((s, i) => (s.orderIndex = i));

  const totalMarks = selected.reduce((sum, s) => sum + (s.marksOverride ?? s.question.marks), 0);
  const timeMinutes = selected.reduce((sum, s) => sum + s.question.estimatedMinutes, 0);

  return {
    id: `ws-${config.seed}-${Date.now()}`,
    name: generateWorksheetName(config),
    config,
    questions: selected,
    totalMarks,
    timeMinutes: Math.ceil(timeMinutes),
    createdAt: new Date().toISOString(),
  };
}

function generateWorksheetName(config: GenerationConfig): string {
  const parts: string[] = [config.board];
  if (config.chapters.length === 1) parts.push(config.chapters[0]);
  else if (config.chapters.length > 1) parts.push(`${config.chapters.length} Chapters`);
  parts.push(config.difficulty === 'mixed' ? 'Mixed' : config.difficulty);
  parts.push(`${config.questionCount}Q`);
  return parts.join(' · ');
}

/**
 * Quick practice generator — returns N random questions from a chapter.
 */
export function generatePractice(
  questions: Question[],
  chapter: string,
  count: number,
  seed: number
): Question[] {
  const rng = mulberry32(seed);
  const pool = questions.filter((q) => q.chapter === chapter);
  const shuffled = shuffle(pool, rng);
  return shuffled.slice(0, count);
}
