import type { CsvRow } from '../types';

const HEADER = ['spanish', 'english'] as const;

type ParsedCsv = {
  rows: CsvRow[];
};

const parseLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((value) => value.trim());
};

export const parseCsv = (content: string): ParsedCsv => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV is empty.');
  }

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  if (header.length !== HEADER.length || !HEADER.every((h, index) => header[index] === h)) {
    throw new Error('CSV header must be "Spanish;English".');
  }

  const rows: CsvRow[] = lines.slice(1).map((line, index) => {
    const cells = parseLine(line);
    if (cells.length !== HEADER.length) {
      throw new Error(`Row ${index + 2} must have exactly two columns.`);
    }
    return {
      spanish: cells[0],
      english: cells[1]
    };
  });

  if (rows.length === 0) {
    throw new Error('CSV must include at least one vocabulary row.');
  }

  return { rows };
};

export const buildLemmaSet = (rows: CsvRow[]): string[] => {
  const lemmaSet = new Set<string>();
  rows.forEach((row) => {
    const lemma = row.spanish.trim().toLowerCase();
    if (lemma) {
      lemmaSet.add(lemma);
    }
  });
  if (lemmaSet.size === 0) {
    throw new Error('No valid Spanish lemmas found.');
  }
  return Array.from(lemmaSet);
};
