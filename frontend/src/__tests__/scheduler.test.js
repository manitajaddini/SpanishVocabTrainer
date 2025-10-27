import { describe, expect, it } from 'vitest';
import { createInitialQueue, getCurrentLemma, markLemmaUsed, reshuffle, skipCurrentLemma } from '../lib/scheduler';
describe('lemma scheduler', () => {
    it('returns lemmas without repetition until exhausted', () => {
        const lemmas = ['comer', 'vivir', 'hablar'];
        let state = createInitialQueue(lemmas);
        const seen = new Set();
        while (true) {
            const lemma = getCurrentLemma(state);
            if (!lemma)
                break;
            expect(seen.has(lemma)).toBe(false);
            seen.add(lemma);
            state = markLemmaUsed(state, lemma);
        }
        expect(seen.size).toBe(lemmas.length);
    });
    it('pushes skipped lemma to the back of the queue', () => {
        const lemmas = ['uno', 'dos'];
        let state = createInitialQueue(lemmas);
        const first = getCurrentLemma(state);
        expect(first).toBeDefined();
        state = skipCurrentLemma(state);
        const second = getCurrentLemma(state);
        expect(second).not.toBe(first);
    });
    it('reshuffle creates new order', () => {
        const lemmas = ['a', 'b', 'c'];
        const state = reshuffle(lemmas);
        expect(state.queue).toHaveLength(lemmas.length);
        expect(new Set(state.queue).size).toBe(lemmas.length);
    });
});
