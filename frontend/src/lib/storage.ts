const STORAGE_PREFIX = 'svt';

export type StorageConfig<T> = {
  key: string;
  version: number;
  migrate?: (storedVersion: number, raw: unknown) => T | null;
};

export const saveState = <T>(config: StorageConfig<T>, value: T) => {
  const payload = {
    version: config.version,
    data: value
  };
  localStorage.setItem(`${STORAGE_PREFIX}:${config.key}`, JSON.stringify(payload));
};

export const loadState = <T>(config: StorageConfig<T>): T | null => {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:${config.key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: number; data?: unknown };
    if (parsed.version === config.version) {
      return parsed.data as T;
    }
    if (config.migrate) {
      return config.migrate(parsed.version ?? 0, parsed.data);
    }
  } catch (error) {
    console.warn('Failed to parse stored state', error);
  }
  return null;
};

export const clearState = (key: string) => {
  localStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
};

export const resetAll = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(`${STORAGE_PREFIX}:`))
    .forEach((key) => localStorage.removeItem(key));
};
