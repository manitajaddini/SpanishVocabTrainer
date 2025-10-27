import { z } from 'zod';

const languagesSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1)
});

export const generateRequestSchema = z.object({
  lemma: z.string().min(1),
  languages: languagesSchema
});

export const evaluateRequestSchema = z.object({
  lemma: z.string().min(1),
  prompt: z.string().min(1),
  userAnswer: z.string().min(1),
  languages: languagesSchema
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
