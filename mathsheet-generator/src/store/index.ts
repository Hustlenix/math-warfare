/**
 * Zustand store — application state for MathSheet Generator.
 */
import { create } from 'zustand';
import type { GenerationConfig, Worksheet, Board, Difficulty, QuestionType, Attempt, StudentProgress } from '@/types';
import { SEED_QUESTIONS } from '@/lib/seed/questions';

const STORAGE_KEY = 'mathsheet-attempts';
const MAX_ATTEMPTS = 200;

// questionId → chapter lookup, built once from the seed question bank
const questionChapterById = new Map<string, string>(
  SEED_QUESTIONS.map((q) => [q.id, q.chapter])
);

function loadAttempts(): Attempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Attempt[]) : [];
  } catch {
    return [];
  }
}

function saveAttempts(attempts: Attempt[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Storage unavailable (private mode / quota) — stay in-memory only
  }
}

interface AppState {
  // Config
  config: GenerationConfig;
  setConfig: (partial: Partial<GenerationConfig>) => void;
  resetConfig: () => void;

  // Worksheet
  currentWorksheet: Worksheet | null;
  setWorksheet: (ws: Worksheet | null) => void;
  worksheetHistory: Worksheet[];
  addToHistory: (ws: Worksheet) => void;

  // Practice
  practiceMode: boolean;
  setPracticeMode: (v: boolean) => void;
  showSolutions: boolean;
  toggleSolutions: () => void;

  // Progress
  attempts: Attempt[];
  addAttempt: (a: Attempt) => void;
  getChapterProgress: (chapter: string) => { attempted: number; correct: number; accuracy: number };

  // UI
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const defaultConfig: GenerationConfig = {
  board: 'CBSE',
  chapters: [],
  difficulty: 'mixed',
  questionCount: 20,
  totalMarks: undefined,
  timeMinutes: undefined,
  questionTypes: ['mcq', 'short_answer', 'long_answer', 'case_based'],
  includeSolutions: true,
  seed: Math.floor(Math.random() * 1000000),
};

export const useAppStore = create<AppState>((set, get) => ({
  // Config
  config: defaultConfig,
  setConfig: (partial) => set((state) => ({
    config: { ...state.config, ...partial },
  })),
  resetConfig: () => set({ config: defaultConfig }),

  // Worksheet
  currentWorksheet: null,
  setWorksheet: (ws) => set({ currentWorksheet: ws }),
  worksheetHistory: [],
  addToHistory: (ws) => set((state) => ({
    worksheetHistory: [ws, ...state.worksheetHistory].slice(0, 50),
  })),

  // Practice
  practiceMode: false,
  setPracticeMode: (v) => set({ practiceMode: v }),
  showSolutions: false,
  toggleSolutions: () => set((state) => ({ showSolutions: !state.showSolutions })),

  // Progress
  attempts: loadAttempts(),
  addAttempt: (a) => set((state) => {
    const attempts = [a, ...state.attempts].slice(0, MAX_ATTEMPTS);
    saveAttempts(attempts);
    return { attempts };
  }),
  getChapterProgress: (chapter) => {
    const attempts = get().attempts;
    let attempted = 0;
    let correct = 0;
    for (const attempt of attempts) {
      for (const ans of attempt.answers) {
        // Only count answers belonging to the requested chapter
        if (questionChapterById.get(ans.questionId) !== chapter) continue;
        attempted++;
        if (ans.isCorrect) correct++;
      }
    }
    return {
      attempted,
      correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    };
  },

  // UI
  darkMode: typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
