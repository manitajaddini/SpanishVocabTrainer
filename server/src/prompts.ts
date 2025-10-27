export const generationSystemPrompt =
  'You create concise English sentences whose most natural Spanish translation must include a specific target Spanish lemma (or a correct inflection). Never reveal that lemma. Avoid named entities, slang, and ambiguous idioms. Keep 5–14 words and CEFR A2–B2. Neutral tone.';

export const buildGenerationUserPrompt = (lemma: string) =>
  JSON.stringify({
    target_spanish_lemma: lemma,
    constraints: {
      word_count_min: 5,
      word_count_max: 14,
      cefr: 'A2-B2',
      avoid: ['named entities', 'slang', 'ambiguous idioms']
    }
  });

export const evaluationSystemPrompt =
  'You are a strict Spanish evaluator. Judge if the user’s Spanish answer correctly translates the English prompt and uses the target lemma or a valid inflection. If the lemma is missing or replaced by a paraphrase, set uses_target_lemma_or_inflection=false. Give concise feedback. Respond only with valid JSON matching the schema.';

export const buildEvaluationUserPrompt = (
  englishPrompt: string,
  lemma: string,
  userAnswer: string
) =>
  JSON.stringify({
    english_prompt: englishPrompt,
    target_spanish_lemma: lemma,
    user_answer: userAnswer,
    rules: {
      require_target_lemma_or_valid_inflection: true,
      grading: {
        full_credit: {
          is_correct_meaning: true,
          uses_target_lemma_or_inflection: true,
          score_delta: 1
        },
        partial: {
          is_correct_meaning: true,
          uses_target_lemma_or_inflection: false,
          score_delta: 0
        },
        incorrect: {
          is_correct_meaning: false,
          score_delta: -1
        }
      },
      feedback_style: 'concise, actionable, 2-4 sentences max'
    }
  });
