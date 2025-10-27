import OpenAI from 'openai';
import type { Request, Response } from 'express';
import { buildEvaluationUserPrompt, buildGenerationUserPrompt, evaluationSystemPrompt, generationSystemPrompt } from './prompts.js';
import { evaluationResponseSchema } from './schemas.js';

const MODEL_GENERATION = 'gpt-4o-mini';
const MODEL_EVALUATION = 'gpt-4o-mini';

const evaluationResponseFormat = {
  type: 'json_schema',
  name: 'evaluation_result',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      is_correct_meaning: { type: 'boolean' },
      uses_target_lemma_or_inflection: { type: 'boolean' },
      grammar_feedback: { type: 'string' },
      improved_translation: { type: 'string' },
      explanations: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 3
      },
      score_delta: {
        type: 'integer',
        enum: [-1, 0, 1]
      }
    },
    required: [
      'is_correct_meaning',
      'uses_target_lemma_or_inflection',
      'grammar_feedback',
      'improved_translation',
      'explanations',
      'score_delta'
    ]
  }
} as const;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const backoff = 300 * 2 ** i;
      await wait(backoff);
    }
  }
  throw lastError;
};

const getApiKey = (req: Request): string => {
  const headerKey = req.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim().length > 0) {
    return headerKey.trim();
  }
  const envKey = process.env.OPENAI_API_KEY;
  if (!envKey) {
    throw Object.assign(new Error('Missing OpenAI API key'), { status: 401 });
  }
  return envKey;
};

const createClient = (apiKey: string) => new OpenAI({ apiKey });

export const handleGenerate = async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKey(req);
    const client = createClient(apiKey);
    const { lemma } = req.body as { lemma: string };
    const result = await withRetry(async () => {
      const response = await client.responses.create({
        model: MODEL_GENERATION,
        input: [
          {
            role: 'system',
            content: generationSystemPrompt
          },
          {
            role: 'user',
            content: buildGenerationUserPrompt(lemma)
          }
        ]
      });
      const text = response.output_text as string | undefined;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
      const output = (response.output?.[0] ?? null) as
        | {
            text?: string | null;
            content?: Array<{ text?: string | null | undefined }>;
          }
        | null;
      if (output?.text && output.text.trim().length > 0) {
        return output.text.trim();
      }
      const fallbackContent = output?.content?.find(
        (part) => part && typeof part.text === 'string' && part.text.trim().length > 0
      )?.text;
      if (fallbackContent) {
        return fallbackContent.trim();
      }
      throw new Error('Invalid generation response');
    });
    res.json({ prompt: result });
  } catch (error) {
    console.error('Generate error', error);
    const status = (error as { status?: number }).status ?? 500;
    res.status(status).json({ error: 'Failed to generate prompt' });
  }
};

export const handleEvaluate = async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKey(req);
    const client = createClient(apiKey);
    const { lemma, englishPrompt, userAnswer } = req.body as {
      lemma: string;
      englishPrompt: string;
      userAnswer: string;
    };
    const evaluation = await withRetry(async () => {
      const response = await client.responses.create({
        model: MODEL_EVALUATION,
        input: [
          {
            role: 'system',
            content: evaluationSystemPrompt
          },
          {
            role: 'user',
            content: buildEvaluationUserPrompt(englishPrompt, lemma, userAnswer)
          }
        ],
        text: {
          format: evaluationResponseFormat
        }
      });
      const text = response.output_text as string | undefined;
      const output = (response.output?.[0] ?? null) as
        | {
            text?: string | null;
            content?: Array<{ text?: string | null | undefined }>;
          }
        | null;
      const outputText =
        (output?.text && output.text.trim().length > 0 ? output.text : null) ??
        output?.content?.find(
          (part) => part && typeof part.text === 'string' && part.text.trim().length > 0
        )?.text ??
        null;
      const raw = text ?? outputText;
      if (!raw) {
        throw new Error('Invalid evaluation response');
      }
      console.log('Evaluation raw response', raw);
      const parsed = JSON.parse(raw);
      return evaluationResponseSchema.parse(parsed);
    });
    res.json({ result: evaluation });
  } catch (error) {
    console.error('Evaluate error', error);
    const status = (error as { status?: number }).status ?? 500;
    res.status(status).json({ error: 'Failed to evaluate answer' });
  }
};
