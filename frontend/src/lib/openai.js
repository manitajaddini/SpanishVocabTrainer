const BASE_URL = (() => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (!envUrl || envUrl.trim().length === 0) {
        return '/api';
    }
    return envUrl.replace(/\/$/, '');
})();
export class ApiError extends Error {
    constructor(message, status, detail, code, body) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
        this.code = code;
        this.body = body;
    }
}
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
const buildHeaders = ({ apiKey, model }) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (apiKey) {
        headers['x-api-key'] = apiKey;
    }
    if (model) {
        headers['x-model'] = model;
    }
    return headers;
};
const parseError = async (response, fallbackMessage) => {
    let message = fallbackMessage;
    let detail;
    let code;
    let body;
    try {
        body = await response.json();
        if (body && typeof body === 'object') {
            const payload = body;
            if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
                message = payload.error;
            }
            if (typeof payload.detail === 'string') {
                detail = payload.detail;
            }
            if (typeof payload.code === 'string') {
                code = payload.code;
            }
        }
    }
    catch {
        // ignore JSON parse errors, fallback to default message
    }
    return new ApiError(message, response.status, detail, code, body);
};
export const generatePrompt = async (params, options = {}) => {
    return withRetry(async () => {
        const response = await fetch(`${BASE_URL}/generate`, {
            method: 'POST',
            headers: buildHeaders(options),
            body: JSON.stringify({
                lemma: params.lemma,
                languages: params.languages
            }),
            signal: options.signal
        });
        if (!response.ok) {
            throw await parseError(response, 'Failed to generate prompt');
        }
        const payload = (await response.json());
        if (!payload.prompt || typeof payload.prompt !== 'string') {
            throw new ApiError('Invalid prompt payload', response.status, undefined, undefined, payload);
        }
        return payload.prompt;
    });
};
export const evaluateAnswer = async (params, options = {}) => {
    return withRetry(async () => {
        const response = await fetch(`${BASE_URL}/evaluate`, {
            method: 'POST',
            headers: buildHeaders(options),
            body: JSON.stringify({
                lemma: params.lemma,
                prompt: params.prompt,
                userAnswer: params.userAnswer,
                languages: params.languages
            }),
            signal: options.signal
        });
        if (!response.ok) {
            throw await parseError(response, 'Failed to evaluate answer');
        }
        const payload = (await response.json());
        if (!payload || typeof payload !== 'object' || !payload.result) {
            throw new ApiError('Invalid evaluation payload', response.status, undefined, undefined, payload);
        }
        return payload.result;
    });
};
