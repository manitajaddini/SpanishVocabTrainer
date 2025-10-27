export type ScoreState = {
  totalScore: number;
  batchScore: number;
  attempts: number;
  correct: number;
  batchAttempts: number;
  batchCorrect: number;
  explanations: string[];
};

export const createInitialScoreState = (): ScoreState => ({
  totalScore: 0,
  batchScore: 0,
  attempts: 0,
  correct: 0,
  batchAttempts: 0,
  batchCorrect: 0,
  explanations: []
});

export const recordEvaluation = (
  state: ScoreState,
  scoreDelta: -1 | 0 | 1,
  isCorrectMeaning: boolean,
  explanationList: string[]
): ScoreState => {
  const explanations = [...state.explanations, ...explanationList];
  const correctIncrement = isCorrectMeaning ? 1 : 0;
  return {
    totalScore: state.totalScore + scoreDelta,
    batchScore: state.batchScore + scoreDelta,
    attempts: state.attempts + 1,
    correct: state.correct + correctIncrement,
    batchAttempts: state.batchAttempts + 1,
    batchCorrect: state.batchCorrect + correctIncrement,
    explanations
  };
};

export const resetBatch = (state: ScoreState): ScoreState => ({
  ...state,
  batchScore: 0,
  batchAttempts: 0,
  batchCorrect: 0,
  explanations: []
});

export const accuracy = (state: ScoreState): number => {
  if (state.attempts === 0) return 0;
  return Math.round((state.correct / state.attempts) * 100);
};

export const batchAccuracy = (state: ScoreState): number => {
  if (state.batchAttempts === 0) return 0;
  return Math.round((state.batchCorrect / state.batchAttempts) * 100);
};

export const averageAttemptsPerItem = (state: ScoreState, completedItems: number): number => {
  if (completedItems === 0) return 0;
  return parseFloat((state.attempts / completedItems).toFixed(2));
};

export const summarizeExplanations = (explanations: string[]): string[] => {
  const counts = new Map<string, number>();
  explanations.forEach((text) => {
    const key = text.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
};
