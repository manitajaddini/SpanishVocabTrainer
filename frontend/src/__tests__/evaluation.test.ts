import { describe, expect, it } from 'vitest';
import { shouldAdvance } from '../lib/evaluation';
import type { EvaluationResult } from '../types';

describe('evaluation logic', () => {
  const baseResult: EvaluationResult = {
    is_correct_meaning: true,
    uses_target_lemma_or_inflection: true,
    grammar_feedback: '',
    improved_translation: '',
    explanations: [''],
    score_delta: 1
  };

  it('advances when meaning and lemma are correct', () => {
    expect(shouldAdvance(baseResult)).toBe(true);
  });

  it('requires lemma usage to advance', () => {
    expect(
      shouldAdvance({
        ...baseResult,
        uses_target_lemma_or_inflection: false
      })
    ).toBe(false);
  });
});
