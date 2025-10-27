export type LanguagePair = {
  source: string;
  target: string;
};

const sanitize = (value: string, fallback: string) => value.trim() || fallback;

export const buildGenerationSystemPrompt = (languages: LanguagePair): string => {
  const source = sanitize(languages.source, 'source language');
  const target = sanitize(languages.target, 'target language');
  return `You create concise ${source} sentences whose most natural ${target} translation must include a specific ${target} lemma (or a correct inflection). Never reveal that lemma. Avoid named entities, slang, and ambiguous idioms. Keep 5-14 words with CEFR A2-B2 difficulty. Maintain a neutral tone.`;
};

export const buildGenerationUserPayload = (lemma: string, languages: LanguagePair) => ({
  target_language: sanitize(languages.target, 'target language'),
  source_language: sanitize(languages.source, 'source language'),
  target_lemma: lemma,
  constraints: {
    word_count_min: 5,
    word_count_max: 14,
    cefr: 'A2-B2',
    avoid: ['named entities', 'slang', 'ambiguous idioms']
  }
});

export const buildEvaluationSystemPrompt = (languages: LanguagePair): string => {
  const source = sanitize(languages.source, 'source language');
  const target = sanitize(languages.target, 'target language');
  return `You are a strict ${target} evaluator. Judge whether the user's ${target} answer correctly translates the ${source} prompt and uses the target lemma or a valid inflection. If the lemma is missing or paraphrased, set uses_target_lemma_or_inflection=false. Give concise feedback and respond only with valid JSON matching the schema.`;
};

export const buildEvaluationUserPayload = (
  prompt: string,
  lemma: string,
  userAnswer: string,
  languages: LanguagePair
) => ({
  source_language: sanitize(languages.source, 'source language'),
  target_language: sanitize(languages.target, 'target language'),
  source_prompt: prompt,
  target_lemma: lemma,
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
    feedback_style: 'Provide concise, actionable feedback in the target language (2-4 sentences maximum).'
  }
});
