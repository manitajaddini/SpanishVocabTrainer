import { z } from 'zod';

export const generateRequestSchema = z.object({
  lemma: z.string().min(1)
});

export const evaluateRequestSchema = z.object({
  lemma: z.string().min(1),
  englishPrompt: z.string().min(1),
  userAnswer: z.string().min(1)
});

export const evaluationResponseSchema = z.object({
  is_correct_meaning: z.boolean(),
  uses_target_lemma_or_inflection: z.boolean(),
  grammar_feedback: z.string(),
  improved_translation: z.string(),
  explanations: z.array(z.string()).min(1).max(3),
  score_delta: z.union([z.literal(-1), z.literal(0), z.literal(1)])
});

export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;
