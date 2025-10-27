import type { EvaluationResult } from '../types';

export const shouldAdvance = (result: EvaluationResult): boolean =>
  result.is_correct_meaning && result.uses_target_lemma_or_inflection;

export const nextScoreDelta = (result: EvaluationResult): -1 | 0 | 1 => result.score_delta;
