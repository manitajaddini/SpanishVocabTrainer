import { useRef, useState } from 'react';
import { buildLemmaSet, parseCsv } from '../lib/csv';
import type { CsvRow } from '../types';

type CsvLoaderProps = {
  onLoaded: (rows: CsvRow[], lemmas: string[]) => void;
  existingCount?: number;
};

const CsvLoader = ({ onLoaded, existingCount }: CsvLoaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      const lemmas = buildLemmaSet(parsed.rows);
      onLoaded(parsed.rows, lemmas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse CSV.');
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <section className="space-y-4 rounded-2xl bg-slate-900 p-6 shadow-lg">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Upload your vocabulary CSV</h2>
        <p className="text-sm text-slate-300">
          Use a semicolon-separated file with headers <code>Spanish;English</code>. Data stays on this device.
        </p>
      </div>
      <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-sm font-medium hover:border-slate-500 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500">
        <span>{loading ? 'Parsing…' : 'Tap to choose CSV'}</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      {existingCount ? (
        <p className="text-sm text-slate-300">Current deck: {existingCount} lemmas.</p>
      ) : null}
      {error ? <p className="text-sm text-rose-300" role="alert">{error}</p> : null}
    </section>
  );
};

export default CsvLoader;
