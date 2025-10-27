import { describe, expect, it } from 'vitest';
import { buildLemmaSet, parseCsv } from '../lib/csv';
describe('csv parser', () => {
    it('parses semicolon separated rows with quotes', () => {
        const csv = `Spanish;English\nComer;"to eat"\n"la casa";"""The house"""`;
        const { rows } = parseCsv(csv);
        expect(rows).toHaveLength(2);
        expect(rows[0].spanish).toBe('Comer');
        expect(rows[0].english).toBe('"to eat"');
        expect(rows[1].spanish).toBe('la casa');
        expect(rows[1].english).toBe('"The house"');
    });
    it('builds unique lemma set', () => {
        const rows = [
            { english: 'to eat', spanish: 'Comer' },
            { english: 'to eat lunch', spanish: 'comer' },
            { english: 'to drink', spanish: 'Beber ' }
        ];
        const lemmas = buildLemmaSet(rows);
        expect(lemmas.sort()).toEqual(['beber', 'comer']);
    });
    it('rejects invalid headers', () => {
        const csv = 'Wrong;Headers\na;b';
        expect(() => parseCsv(csv)).toThrow();
    });
});
