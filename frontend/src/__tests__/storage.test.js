import { describe, expect, it, beforeEach } from 'vitest';
import { clearState, loadState, resetAll, saveState } from '../lib/storage';
describe('storage helpers', () => {
    const config = { key: 'demo', version: 1 };
    beforeEach(() => {
        resetAll();
    });
    it('persists and loads state', () => {
        const payload = { count: 2 };
        saveState(config, payload);
        const value = loadState(config);
        expect(value).toEqual(payload);
    });
    it('returns null for different versions', () => {
        saveState(config, { count: 1 });
        const rawKey = `svt:${config.key}`;
        const stored = JSON.parse(localStorage.getItem(rawKey) || '{}');
        stored.version = 0;
        localStorage.setItem(rawKey, JSON.stringify(stored));
        const value = loadState(config);
        expect(value).toBeNull();
    });
    it('clears stored key', () => {
        saveState(config, { count: 3 });
        clearState(config.key);
        const value = loadState(config);
        expect(value).toBeNull();
    });
});
