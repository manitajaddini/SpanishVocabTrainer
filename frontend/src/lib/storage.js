const STORAGE_PREFIX = 'svt';
export const saveState = (config, value) => {
    const payload = {
        version: config.version,
        data: value
    };
    localStorage.setItem(`${STORAGE_PREFIX}:${config.key}`, JSON.stringify(payload));
};
export const loadState = (config) => {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${config.key}`);
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed.version === config.version) {
            return parsed.data;
        }
        if (config.migrate) {
            return config.migrate(parsed.version ?? 0, parsed.data);
        }
    }
    catch (error) {
        console.warn('Failed to parse stored state', error);
    }
    return null;
};
export const clearState = (key) => {
    localStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
};
export const resetAll = () => {
    Object.keys(localStorage)
        .filter((key) => key.startsWith(`${STORAGE_PREFIX}:`))
        .forEach((key) => localStorage.removeItem(key));
};
