import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { buildLemmaSet, parseCsv } from '../lib/csv';
const CsvLoader = ({ onLoaded, existingCount }) => {
    const inputRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleFile = async (file) => {
        setError(null);
        setLoading(true);
        try {
            const text = await file.text();
            const parsed = parseCsv(text);
            const lemmas = buildLemmaSet(parsed.rows);
            onLoaded(parsed.rows, lemmas, parsed.detectedLanguages);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to parse CSV.');
        }
        finally {
            setLoading(false);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };
    return (_jsxs("section", { className: "space-y-4 rounded-2xl bg-slate-900 p-6 shadow-lg", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Upload your vocabulary CSV" }), _jsx("p", { className: "text-sm text-slate-300", children: "Use a semicolon-separated file with two headers (target language;source language). Data stays on this device." })] }), _jsxs("label", { className: "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-sm font-medium hover:border-slate-500 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500", children: [_jsx("span", { children: loading ? 'Parsing…' : 'Tap to choose CSV' }), _jsx("input", { ref: inputRef, type: "file", accept: ".csv,text/csv", className: "sr-only", onChange: (event) => {
                            const file = event.target.files?.[0];
                            if (file)
                                handleFile(file);
                        } })] }), existingCount ? (_jsxs("p", { className: "text-sm text-slate-300", children: ["Current deck: ", existingCount, " lemmas."] })) : null, error ? _jsx("p", { className: "text-sm text-rose-300", role: "alert", children: error }) : null] }));
};
export default CsvLoader;
