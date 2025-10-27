export type InsightEvent = {
  lemma: string;
  correct: boolean;
  timestamp: number;
};

export type InsightState = {
  streak: number;
  bestStreak: number;
  recent: InsightEvent[];
  misses: Record<string, number>;
};

const RECENT_LIMIT = 20;

export const createInitialInsightState = (): InsightState => ({
  streak: 0,
  bestStreak: 0,
  recent: [],
  misses: {}
});

export const recordOutcome = (state: InsightState, lemma: string, correct: boolean): InsightState => {
  const recent = [...state.recent, { lemma, correct, timestamp: Date.now() }];
  if (recent.length > RECENT_LIMIT) {
    recent.splice(0, recent.length - RECENT_LIMIT);
  }
  const streak = correct ? state.streak + 1 : 0;
  const bestStreak = correct ? Math.max(streak, state.bestStreak) : state.bestStreak;

  const misses = { ...state.misses };
  if (correct) {
    if (misses[lemma]) {
      misses[lemma] = Math.max(0, misses[lemma] - 1);
      if (misses[lemma] === 0) {
        delete misses[lemma];
      }
    }
  } else {
    misses[lemma] = (misses[lemma] ?? 0) + 1;
  }

  return {
    streak,
    bestStreak,
    recent,
    misses
  };
};

export const recentAccuracy = (state: InsightState, windowSize = 10): number => {
  if (state.recent.length === 0) return 0;
  const slice = state.recent.slice(-windowSize);
  const correct = slice.filter((event) => event.correct).length;
  return Math.round((correct / slice.length) * 100);
};

export const hardestLemmas = (state: InsightState, limit = 3): Array<{ lemma: string; count: number }> => {
  return Object.entries(state.misses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([lemma, count]) => ({ lemma, count }));
};

export const totalAttemptsTracked = (state: InsightState): number => state.recent.length;
