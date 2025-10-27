import { describe, expect, it } from 'vitest';
import { buildLemmaSet, parseCsv } from '../lib/csv';
describe('csv parser', () => {
    it('parses semicolon separated rows with quotes', () => {
        const csv = `Spanish;English\nComer;"to eat"\n"la casa";"""The house"""`;
        const { rows, detectedLanguages } = parseCsv(csv);
        expect(rows).toHaveLength(2);
        expect(rows[0].target).toBe('Comer');
        expect(rows[0].source).toBe('to eat');
        expect(rows[1].target).toBe('la casa');
        expect(rows[1].source).toBe('"The house"');
        expect(detectedLanguages).toEqual({ target: 'Spanish', source: 'English' });
    });
    it('builds unique lemma set', () => {
        const rows = [
            { source: 'to eat', target: 'Comer' },
            { source: 'to eat lunch', target: 'comer' },
            { source: 'to drink', target: 'Beber ' }
        ];
        const lemmas = buildLemmaSet(rows);
        expect(lemmas.sort()).toEqual(['beber', 'comer']);
    });
    it('rejects invalid headers', () => {
        const csv = 'MissingOnlyOneHeader\nvalue';
        expect(() => parseCsv(csv)).toThrow();
    });
});
