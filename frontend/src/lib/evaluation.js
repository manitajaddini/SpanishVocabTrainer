export const shouldAdvance = (result) => result.is_correct_meaning && result.uses_target_lemma_or_inflection;
export const nextScoreDelta = (result) => result.score_delta;
