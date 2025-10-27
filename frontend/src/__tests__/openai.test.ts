import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluateAnswer, generatePrompt } from '../lib/openai';

const mockEvaluation = {
  is_correct_meaning: true,
  uses_target_lemma_or_inflection: true,
  grammar_feedback: 'Great',
  improved_translation: 'Excelente',
  explanations: ['todo bien'],
  score_delta: 1
};

describe('openai client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries prompt generation before succeeding', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({ ok: true, json: async () => ({ prompt: 'Test prompt' }) });
    vi.stubGlobal('fetch', fetchMock);

    const prompt = await generatePrompt(
      { lemma: 'hablar', languages: { source: 'English', target: 'Spanish' } },
      { apiKey: 'secret' }
    );
    expect(prompt).toBe('Test prompt');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('secret');
  });

  it('returns evaluation payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: mockEvaluation }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await evaluateAnswer(
      {
        lemma: 'hablar',
        prompt: 'Speak clearly',
        userAnswer: 'Habla claro',
        languages: { source: 'English', target: 'Spanish' }
      },
      { apiKey: 'secret' }
    );
    expect(result).toEqual(mockEvaluation);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/evaluate',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'secret' })
      })
    );
  });
});
