export type CsvRow = {
  english: string;
  spanish: string;
};

export type LemmaQueueState = {
  lemmas: string[];
  queue: string[];
  cursor: number;
  usedSet: string[];
};

export type StoredState<T> = {
  version: number;
  data: T;
};

export type QuizItem = {
  lemma: string;
  englishPrompt: string;
  status: 'pending' | 'evaluating' | 'feedback';
  attempts: number;
  lastResult?: EvaluationResult;
};

export type EvaluationResult = {
  is_correct_meaning: boolean;
  uses_target_lemma_or_inflection: boolean;
  grammar_feedback: string;
  improved_translation: string;
  explanations: string[];
  score_delta: -1 | 0 | 1;
};

export type QuizProgress = {
  total: number;
  remaining: number;
  used: number;
  batchIndex: number;
  batchCompleted: boolean;
  batchScore: number;
  totalScore: number;
  attempts: number;
  correct: number;
  explanations: string[];
};

export type AppView = 'welcome' | 'quiz' | 'batch-summary';

export type ApiKeyState = {
  key: string;
};

export type PendingAction = 'generate' | 'evaluate';

export type RetryState = {
  action: PendingAction;
  lemma: string;
  payload: Record<string, unknown>;
  message: string;
  detail?: string;
  status?: number;
  code?: string;
};
