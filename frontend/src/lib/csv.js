const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ';' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current);
    return result.map((value) => value.trim());
};
export const parseCsv = (content) => {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    if (lines.length === 0) {
        throw new Error('CSV is empty.');
    }
    const headerCells = parseLine(lines[0]);
    if (headerCells.length !== 2) {
        throw new Error('CSV header must contain exactly two columns.');
    }
    const rows = lines.slice(1).map((line, index) => {
        const cells = parseLine(line);
        if (cells.length !== 2) {
            throw new Error(`Row ${index + 2} must have exactly two columns.`);
        }
        return {
            target: cells[0],
            source: cells[1]
        };
    });
    if (rows.length === 0) {
        throw new Error('CSV must include at least one vocabulary row.');
    }
    const detectedLanguages = {
        target: headerCells[0]?.trim() || 'Target language',
        source: headerCells[1]?.trim() || 'Source language'
    };
    return { rows, detectedLanguages };
};
export const buildLemmaSet = (rows) => {
    const lemmaSet = new Set();
    rows.forEach((row) => {
        const lemma = row.target.trim().toLowerCase();
        if (lemma) {
            lemmaSet.add(lemma);
        }
    });
    if (lemmaSet.size === 0) {
        throw new Error('No valid target lemmas found.');
    }
    return Array.from(lemmaSet);
};
