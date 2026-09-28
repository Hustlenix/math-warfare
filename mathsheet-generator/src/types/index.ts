// ===== Board & Curriculum =====

export type Board = 'CBSE' | 'ICSE' | 'MAHARASHTRA' | 'KARNATAKA' | 'TAMIL_NADU' | 'ANDHRA_PRADESH' | 'KERALA';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'case_based';

export type PaperType = 'board' | 'sample' | 'practice';

// ===== Question Schema =====

export interface Question {
  id: string;
  board: Board;
  year: number;
  paperType: PaperType;
  chapter: string;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  type?: QuestionType;
  marks: number;
  estimatedMinutes: number;
  questionLatex: string;
  questionHtml?: string;
  solution: Solution;
  tags?: string[];
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Solution {
  steps: string[];
  answerLatex: string;
  answerText?: string;
  explanation?: string;
  commonMistakes?: string[];
  relatedTopics?: string[];
}

// ===== MCQ =====

export interface MCQQuestion extends Question {
  type: 'mcq';
  options: MCQOption[];
}

export interface MCQOption {
  index: number;
  text: string;
  isCorrect: boolean;
}

// ===== Generation Config =====

export interface GenerationConfig {
  board: Board;
  chapters: string[];
  difficulty: Difficulty | 'mixed';
  questionCount: number;
  totalMarks?: number;
  timeMinutes?: number;
  questionTypes: QuestionType[];
  includeSolutions: boolean;
  seed: number;
}

// ===== Worksheet =====

export interface Worksheet {
  id: string;
  name: string;
  config: GenerationConfig;
  questions: WorksheetQuestion[];
  totalMarks: number;
  timeMinutes: number;
  createdAt: string;
}

export interface WorksheetQuestion {
  question: Question;
  orderIndex: number;
  marksOverride?: number;
}

// ===== Attempt Tracking =====

export interface Attempt {
  id: string;
  worksheetId: string;
  answers: AttemptAnswer[];
  totalMarks: number;
  obtainedMarks: number;
  accuracy: number;
  timeTakenSeconds: number;
  startedAt: string;
  completedAt: string;
}

export interface AttemptAnswer {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

// ===== Student Progress =====

export interface ChapterProgress {
  chapter: string;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  masteryLevel: number;
}

export interface StudentProgress {
  overall: {
    questionsAttempted: number;
    questionsCorrect: number;
    accuracy: number;
  };
  byChapter: ChapterProgress[];
  streak: number;
  lastPracticedAt?: string;
}

// ===== CBSE Chapters =====

export const CBSE_CHAPTERS = [
  'Real Numbers',
  'Polynomials',
  'Pair of Linear Equations in Two Variables',
  'Quadratic Equations',
  'Arithmetic Progressions',
  'Triangles',
  'Coordinate Geometry',
  'Introduction to Trigonometry',
  'Some Applications of Trigonometry',
  'Circles',
  'Areas Related to Circles',
  'Surface Areas and Volumes',
  'Statistics',
  'Probability',
] as const;

export type CBSEChapter = (typeof CBSE_CHAPTERS)[number];

// ===== Difficulty Weights =====

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-emerald-600 bg-emerald-50',
  medium: 'text-amber-600 bg-amber-50',
  hard: 'text-red-600 bg-red-50',
};
