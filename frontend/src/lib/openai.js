const BASE_URL = '/api';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const withRetry = async (fn, attempts = 3) => {
    let lastError;
    for (let i = 0; i < attempts; i += 1) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const backoff = 300 * 2 ** i;
            await wait(backoff);
        }
    }
    throw lastError;
};
const buildHeaders = (apiKey) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (apiKey) {
        headers['x-api-key'] = apiKey;
    }
    return headers;
};
export const generatePrompt = async (lemma, apiKey, signal) => {
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
        const payload = (await response.json());
        if (!payload.prompt || typeof payload.prompt !== 'string') {
            throw new Error('Invalid prompt payload');
        }
        return payload.prompt;
    });
};
export const evaluateAnswer = async (lemma, englishPrompt, userAnswer, apiKey, signal) => {
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
        const payload = (await response.json());
        return payload.result;
    });
};
