/**
 * Simplified database layer — in-memory for MVP.
 * Seed questions are loaded directly from the seed file.
 * No sql.js WASM, no CDN, no IndexedDB needed for MVP.
 *
 * TODO: Add sql.js persistence for offline worksheets in future version.
 */
import { SEED_QUESTIONS } from '@/lib/seed/questions';
import type { Question } from '@/types';

let _questions: Question[] = [];

export async function getDb(): Promise<void> {
  // No-op for MVP — questions loaded from seed file
  return;
}

export async function getQuestionCount(): Promise<number> {
  return SEED_QUESTIONS.length;
}

export async function insertQuestions(questions: Question[]): Promise<number> {
  _questions = questions;
  return questions.length;
}

export async function queryQuestions(filters: Record<string, unknown> = {}): Promise<Question[]> {
  let pool = [...SEED_QUESTIONS];

  if (filters.board) {
    pool = pool.filter((q) => q.board === filters.board);
  }
  if (filters.chapter) {
    pool = pool.filter((q) => q.chapter === filters.chapter);
  }
  if (filters.difficulty) {
    pool = pool.filter((q) => q.difficulty === filters.difficulty);
  }

  return pool;
}

export async function getChapters(): Promise<string[]> {
  return [...new Set(SEED_QUESTIONS.map((q) => q.chapter))].sort();
}
