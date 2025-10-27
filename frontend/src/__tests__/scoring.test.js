import { describe, expect, it } from 'vitest';
import { accuracy, averageAttemptsPerItem, batchAccuracy, createInitialScoreState, recordEvaluation, resetBatch, summarizeExplanations } from '../lib/scoring';
describe('scoring utilities', () => {
    it('tracks totals and accuracy', () => {
        let state = createInitialScoreState();
        state = recordEvaluation(state, 1, true, ['Great job']);
        state = recordEvaluation(state, -1, false, ['Missed lemma']);
        expect(state.totalScore).toBe(0);
        expect(accuracy(state)).toBe(50);
        expect(batchAccuracy(state)).toBe(50);
        expect(averageAttemptsPerItem(state, 2)).toBe(1);
    });
    it('resets batch values', () => {
        let state = createInitialScoreState();
        state = recordEvaluation(state, 1, true, ['Great job']);
        state = resetBatch(state);
        expect(state.batchScore).toBe(0);
        expect(state.batchAttempts).toBe(0);
        expect(state.explanations).toHaveLength(0);
    });
    it('summarizes explanations by frequency', () => {
        const issues = summarizeExplanations(['Accent', 'accent', 'Gender']);
        expect(issues[0]).toBe('accent');
    });
});
