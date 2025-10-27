import OpenAI from 'openai';
import type { Request, Response } from 'express';
import { buildEvaluationUserPrompt, buildGenerationUserPrompt, evaluationSystemPrompt, generationSystemPrompt } from './prompts.js';
import { evaluationResponseSchema } from './schemas.js';

const MODEL_GENERATION = 'gpt-4o-mini';
const MODEL_EVALUATION = 'gpt-4o-mini';
const ALLOWED_MODELS = new Set<string>(['gpt-4o-mini', 'gpt-4o']);

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

const shouldRetry = (error: unknown) => {
  const status = (error as { status?: number })?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }
  return true;
};

const withRetry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || i === attempts - 1) {
        break;
      }
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

const resolveModel = (req: Request, fallback: string) => {
  const headerModel = req.headers['x-model'];
  if (typeof headerModel === 'string') {
    const trimmed = headerModel.trim();
    if (ALLOWED_MODELS.has(trimmed)) {
      return trimmed;
    }
    console.warn(`Unsupported model "${trimmed}" requested. Falling back to ${fallback}.`);
  }
  return fallback;
};

const normalizeError = (error: unknown, fallback: string) => {
  if (error instanceof OpenAI.APIError) {
    const detail =
      typeof error.error === 'object' && error.error !== null && 'message' in error.error
        ? String((error.error as { message?: unknown }).message ?? error.message)
        : error.message;
    const code =
      typeof error.code === 'string'
        ? error.code
        : typeof (error.error as { code?: unknown })?.code === 'string'
          ? String((error.error as { code?: unknown }).code)
          : undefined;
    return {
      status: error.status ?? 500,
      body: {
        error: fallback,
        detail,
        code
      }
    };
  }
  const status = (error as { status?: number })?.status ?? 500;
  const detail =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown })?.message === 'string'
        ? String((error as { message?: unknown }).message)
        : undefined;
  const code =
    typeof (error as { code?: unknown })?.code === 'string' ? String((error as { code?: unknown }).code) : undefined;
  return {
    status,
    body: {
      error: fallback,
      detail: detail ?? fallback,
      code
    }
  };
};

export const handleGenerate = async (req: Request, res: Response) => {
  const model = resolveModel(req, MODEL_GENERATION);
  try {
    const apiKey = getApiKey(req);
    const client = createClient(apiKey);
    const { lemma } = req.body as { lemma: string };
    const result = await withRetry(async () => {
      const response = await client.responses.create({
        model,
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
    const normalized = normalizeError(error, 'Failed to generate prompt');
    res.status(normalized.status).json({ ...normalized.body, model });
  }
};

export const handleEvaluate = async (req: Request, res: Response) => {
  const model = resolveModel(req, MODEL_EVALUATION);
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
        model,
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
      const parsed = JSON.parse(raw);
      return evaluationResponseSchema.parse(parsed);
    });
    res.json({ result: evaluation });
  } catch (error) {
    console.error('Evaluate error', error);
    const normalized = normalizeError(error, 'Failed to evaluate answer');
    res.status(normalized.status).json({ ...normalized.body, model });
  }
};
