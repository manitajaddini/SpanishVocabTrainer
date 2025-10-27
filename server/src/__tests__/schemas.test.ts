import { describe, expect, it } from 'vitest';
import { evaluationResponseSchema, evaluateRequestSchema, generateRequestSchema } from '../schemas.js';

describe('schema validation', () => {
  it('accepts valid generate request', () => {
    const parsed = generateRequestSchema.parse({ lemma: 'hablar' });
    expect(parsed.lemma).toBe('hablar');
  });

  it('rejects invalid generate request', () => {
    expect(() => generateRequestSchema.parse({ lemma: '' })).toThrow();
  });

  it('accepts valid evaluate request', () => {
    const parsed = evaluateRequestSchema.parse({
      lemma: 'comer',
      englishPrompt: 'Eat your lunch',
      userAnswer: 'Come tu almuerzo'
    });
    expect(parsed.lemma).toBe('comer');
  });

  it('rejects malformed evaluation response', () => {
    expect(() =>
      evaluationResponseSchema.parse({
        is_correct_meaning: true,
        uses_target_lemma_or_inflection: true,
        grammar_feedback: 'Bien hecho',
        improved_translation: 'Lo hiciste genial',
        explanations: ['Todo correcto'],
        score_delta: 5
      })
    ).toThrow();
  });

  it('accepts well-formed evaluation response', () => {
    const parsed = evaluationResponseSchema.parse({
      is_correct_meaning: true,
      uses_target_lemma_or_inflection: true,
      grammar_feedback: 'Gran trabajo',
      improved_translation: 'Gran trabajo',
      explanations: ['Mantén el tiempo verbal'],
      score_delta: 1
    });
    expect(parsed.score_delta).toBe(1);
  });
});
