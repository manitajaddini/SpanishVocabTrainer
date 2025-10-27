import type { EvaluationResult } from '../types';

const BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl.trim().length === 0) {
    return '/api';
  }
  return envUrl.replace(/\/$/, '');
})();

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

const buildHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
};

export const generatePrompt = async (lemma: string, apiKey?: string, signal?: AbortSignal): Promise<string> => {
  return withRetry(async () => {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify({ lemma }),
      signal
    });
    if (!response.ok) {
      throw new Error('Failed to generate prompt');
    }
    const payload = (await response.json()) as { prompt: string };
    if (!payload.prompt || typeof payload.prompt !== 'string') {
      throw new Error('Invalid prompt payload');
    }
    return payload.prompt;
  });
};

export const evaluateAnswer = async (
  lemma: string,
  englishPrompt: string,
  userAnswer: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<EvaluationResult> => {
  return withRetry(async () => {
    const response = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify({ lemma, englishPrompt, userAnswer }),
      signal
    });
    if (!response.ok) {
      throw new Error('Failed to evaluate answer');
    }
    const payload = (await response.json()) as { result: EvaluationResult };
    return payload.result;
  });
};
