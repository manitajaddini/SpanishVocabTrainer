const RECENT_LIMIT = 20;
export const createInitialInsightState = () => ({
    streak: 0,
    bestStreak: 0,
    recent: [],
    misses: {}
});
export const recordOutcome = (state, lemma, correct) => {
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
    }
    else {
        misses[lemma] = (misses[lemma] ?? 0) + 1;
    }
    return {
        streak,
        bestStreak,
        recent,
        misses
    };
};
export const recentAccuracy = (state, windowSize = 10) => {
    if (state.recent.length === 0)
        return 0;
    const slice = state.recent.slice(-windowSize);
    const correct = slice.filter((event) => event.correct).length;
    return Math.round((correct / slice.length) * 100);
};
export const hardestLemmas = (state, limit = 3) => {
    return Object.entries(state.misses)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([lemma, count]) => ({ lemma, count }));
};
export const totalAttemptsTracked = (state) => state.recent.length;
