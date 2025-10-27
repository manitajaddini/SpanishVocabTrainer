import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import CsvLoader from './components/CsvLoader';
import QuizCard from './components/QuizCard';
import ScorePanel from './components/ScorePanel';
import Settings from './components/Settings';
import { generatePrompt, evaluateAnswer } from './lib/openai';
import { createInitialQueue, getCurrentLemma, isExhausted, markLemmaUsed, reshuffle, skipCurrentLemma } from './lib/scheduler';
import { clearState, loadState, saveState } from './lib/storage';
import { averageAttemptsPerItem, batchAccuracy, createInitialScoreState, recordEvaluation, resetBatch, accuracy, summarizeExplanations } from './lib/scoring';
import { shouldAdvance } from './lib/evaluation';
const CSV_STORAGE = { key: 'csv-data', version: 1 };
const QUEUE_STORAGE = { key: 'queue', version: 1 };
const SCORE_STORAGE = { key: 'score', version: 1 };
const PROGRESS_STORAGE = { key: 'progress', version: 1 };
const CURRENT_STORAGE = { key: 'current', version: 1 };
const API_KEY_STORAGE = { key: 'api-key', version: 1 };
const initialProgress = {
    completedInBatch: 0,
    totalCompleted: 0
};
const App = () => {
    const [csvData, setCsvData] = useState(null);
    const [queue, setQueue] = useState(null);
    const [scoreState, setScoreState] = useState(createInitialScoreState);
    const [progress, setProgress] = useState(initialProgress);
    const [currentItem, setCurrentItem] = useState(null);
    const [answer, setAnswer] = useState('');
    const [view, setView] = useState('welcome');
    const [apiKey, setApiKey] = useState('');
    const [modelError, setModelError] = useState(null);
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [batchSummary, setBatchSummary] = useState(null);
    useEffect(() => {
        const storedKey = loadState(API_KEY_STORAGE);
        if (storedKey)
            setApiKey(storedKey);
        const storedCsv = loadState(CSV_STORAGE);
        if (storedCsv) {
            setCsvData(storedCsv);
            setView('quiz');
        }
        const storedQueue = loadState(QUEUE_STORAGE);
        if (storedQueue)
            setQueue(storedQueue);
        const storedScore = loadState(SCORE_STORAGE);
        if (storedScore)
            setScoreState(storedScore);
        const storedProgress = loadState(PROGRESS_STORAGE);
        if (storedProgress)
            setProgress(storedProgress);
        const storedCurrent = loadState(CURRENT_STORAGE);
        if (storedCurrent) {
            setCurrentItem({
                lemma: storedCurrent.lemma,
                englishPrompt: storedCurrent.englishPrompt,
                status: 'pending',
                attempts: storedCurrent.attempts
            });
            setAnswer(storedCurrent.answer);
        }
    }, []);
    useEffect(() => {
        if (csvData) {
            saveState(CSV_STORAGE, csvData);
        }
    }, [csvData]);
    useEffect(() => {
        if (queue) {
            saveState(QUEUE_STORAGE, queue);
        }
    }, [queue]);
    useEffect(() => {
        saveState(SCORE_STORAGE, scoreState);
    }, [scoreState]);
    useEffect(() => {
        saveState(PROGRESS_STORAGE, progress);
    }, [progress]);
    useEffect(() => {
        if (currentItem) {
            saveState(CURRENT_STORAGE, {
                lemma: currentItem.lemma,
                englishPrompt: currentItem.englishPrompt,
                attempts: currentItem.attempts,
                answer
            });
        }
        else {
            clearState(CURRENT_STORAGE.key);
        }
    }, [currentItem, answer]);
    const lemmasLeft = useMemo(() => {
        if (!queue)
            return 0;
        return queue.lemmas.length - queue.usedSet.length;
    }, [queue]);
    const loadNextLemma = async (targetQueue) => {
        const lemma = getCurrentLemma(targetQueue);
        if (!lemma) {
            setCurrentItem(null);
            setAnswer('');
            return;
        }
        setLoadingPrompt(true);
        setModelError(null);
        try {
            const prompt = await generatePrompt(lemma, apiKey);
            const item = {
                lemma,
                englishPrompt: prompt,
                status: 'pending',
                attempts: 0
            };
            setCurrentItem(item);
            setAnswer('');
        }
        catch (error) {
            console.error(error);
            setModelError({ action: 'generate', lemma, payload: {} });
        }
        finally {
            setLoadingPrompt(false);
        }
    };
    useEffect(() => {
        if (queue && !currentItem && !loadingPrompt) {
            const lemma = getCurrentLemma(queue);
            if (lemma) {
                void loadNextLemma(queue);
            }
        }
    }, [queue, currentItem, loadingPrompt]);
    const handleCsvLoaded = (rows, lemmas) => {
        const newQueue = createInitialQueue(lemmas);
        setCsvData({ rows, lemmas });
        setQueue(newQueue);
        setScoreState(createInitialScoreState());
        setProgress(initialProgress);
        setCurrentItem(null);
        setAnswer('');
        setBatchSummary(null);
        setView('quiz');
    };
    const persistQueueUpdate = (next) => {
        setQueue(next);
    };
    const handleSubmit = async () => {
        if (!currentItem || !queue)
            return;
        const { lemma, englishPrompt } = currentItem;
        const nextAttempts = currentItem.attempts + 1;
        setCurrentItem((prev) => (prev ? { ...prev, status: 'evaluating', attempts: nextAttempts, lastResult: undefined } : prev));
        try {
            const result = await evaluateAnswer(lemma, englishPrompt, answer, apiKey);
            setScoreState((prev) => recordEvaluation(prev, result.score_delta, result.is_correct_meaning, result.explanations));
            if (shouldAdvance(result)) {
                const updatedQueue = markLemmaUsed(queue, lemma);
                persistQueueUpdate(updatedQueue);
                setProgress((prev) => ({
                    completedInBatch: prev.completedInBatch + 1,
                    totalCompleted: prev.totalCompleted + 1
                }));
                setCurrentItem(null);
                setAnswer('');
            }
            else {
                setCurrentItem((prev) => (prev ? { ...prev, status: 'feedback', attempts: nextAttempts, lastResult: result } : prev));
            }
        }
        catch (error) {
            console.error(error);
            setModelError({
                action: 'evaluate',
                lemma,
                payload: {
                    englishPrompt,
                    userAnswer: answer
                }
            });
            setCurrentItem((prev) => (prev ? { ...prev, status: 'pending', attempts: nextAttempts - 1 } : prev));
        }
    };
    useEffect(() => {
        if (progress.completedInBatch >= 10) {
            setBatchSummary({
                score: scoreState.batchScore,
                accuracy: batchAccuracy(scoreState),
                attempts: scoreState.batchAttempts,
                issues: summarizeExplanations(scoreState.explanations)
            });
            setView('batch-summary');
            setScoreState((prev) => resetBatch(prev));
            setProgress((prev) => ({ ...prev, completedInBatch: 0 }));
        }
    }, [progress.completedInBatch, scoreState]);
    const handleRetryFeedback = () => {
        if (!currentItem)
            return;
        setCurrentItem({
            lemma: currentItem.lemma,
            englishPrompt: currentItem.englishPrompt,
            status: 'pending',
            attempts: currentItem.attempts,
            lastResult: undefined
        });
    };
    const handleNextAfterFeedback = () => {
        if (!currentItem || !queue)
            return;
        const updatedQueue = markLemmaUsed(queue, currentItem.lemma);
        persistQueueUpdate(updatedQueue);
        setProgress((prev) => ({
            completedInBatch: prev.completedInBatch + 1,
            totalCompleted: prev.totalCompleted + 1
        }));
        setCurrentItem(null);
        setAnswer('');
    };
    const handleSkip = () => {
        if (!queue)
            return;
        const updatedQueue = skipCurrentLemma(queue);
        persistQueueUpdate(updatedQueue);
        setCurrentItem(null);
        setAnswer('');
        setModelError(null);
    };
    const handleRetryModel = () => {
        if (!queue || !modelError)
            return;
        setModelError(null);
        if (modelError.action === 'generate') {
            void loadNextLemma(queue);
        }
        else if (modelError.action === 'evaluate' && currentItem) {
            void handleSubmit();
        }
    };
    const handleSaveApiKey = (value) => {
        setApiKey(value);
        saveState(API_KEY_STORAGE, value);
    };
    const handleReset = () => {
        [CSV_STORAGE.key, QUEUE_STORAGE.key, SCORE_STORAGE.key, PROGRESS_STORAGE.key, CURRENT_STORAGE.key].forEach((key) => clearState(key));
        setCsvData(null);
        setQueue(null);
        setScoreState(createInitialScoreState());
        setProgress(initialProgress);
        setCurrentItem(null);
        setAnswer('');
        setBatchSummary(null);
        setView('welcome');
    };
    const handleResumeBatch = () => {
        setBatchSummary(null);
        setView('quiz');
    };
    const handleReshuffle = () => {
        if (!csvData)
            return;
        const nextQueue = reshuffle(csvData.lemmas);
        persistQueueUpdate(nextQueue);
        setProgress(initialProgress);
        setCurrentItem(null);
        setAnswer('');
        setBatchSummary(null);
        setView('quiz');
    };
    const totalLemmas = csvData?.lemmas.length ?? 0;
    const usedCount = queue?.usedSet.length ?? 0;
    const batchProgress = progress.completedInBatch;
    const acc = accuracy(scoreState);
    const avgAttempts = averageAttemptsPerItem(scoreState, progress.totalCompleted);
    const showCompletion = queue ? isExhausted(queue) && !getCurrentLemma(queue) : false;
    return (_jsxs("main", { className: "mx-auto flex min-h-[100svh] max-w-3xl flex-col gap-6 p-4 pb-[max(4rem,env(safe-area-inset-bottom))]", children: [_jsxs("header", { className: "space-y-2 pt-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Spanish Lemma Trainer" }), _jsx("p", { className: "text-sm text-slate-300", children: "Practice every lemma exactly once per cycle. Progress lives on this device." })] }), view === 'welcome' ? _jsx(CsvLoader, { onLoaded: handleCsvLoaded }) : null, view === 'quiz' && csvData && queue ? (_jsxs("div", { className: "space-y-4", children: [_jsx(ScorePanel, { lemmasLeft: lemmasLeft, totalLemmas: totalLemmas, usedCount: usedCount, batchProgress: batchProgress, totalScore: scoreState.totalScore, batchScore: scoreState.batchScore, accuracy: acc, attempts: scoreState.attempts, avgAttempts: avgAttempts }), currentItem ? (_jsx(QuizCard, { englishPrompt: currentItem.englishPrompt, answer: answer, status: currentItem.status, attempts: currentItem.attempts, onAnswerChange: setAnswer, onSubmit: handleSubmit, onRetry: handleRetryFeedback, onNext: handleNextAfterFeedback, feedback: currentItem.lastResult, targetLemma: currentItem.status === 'feedback' ? currentItem.lemma : undefined, disableInput: loadingPrompt })) : (_jsx("div", { className: "rounded-2xl bg-slate-900 p-6 text-center text-sm text-slate-300", children: loadingPrompt ? 'Loading next item…' : 'Select “Reshuffle & restart” once you finish this cycle.' }))] })) : null, view === 'batch-summary' && batchSummary ? (_jsxs("section", { className: "space-y-4 rounded-2xl bg-slate-900 p-6 text-sm shadow-lg", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Batch complete!" }), _jsxs("p", { children: ["Batch score: ", batchSummary.score] }), _jsxs("p", { children: ["Accuracy this batch: ", batchSummary.accuracy, "%"] }), _jsxs("p", { children: ["Attempts this batch: ", batchSummary.attempts] }), batchSummary.issues.length > 0 ? (_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-200", children: "Common themes" }), _jsx("ul", { className: "list-disc space-y-1 pl-5 text-slate-300", children: batchSummary.issues.map((issue) => (_jsx("li", { children: issue }, issue))) })] })) : null, _jsx("p", { className: "text-slate-300", children: "Great work\u2014keep your streak going!" }), _jsx("button", { type: "button", className: "w-full rounded-full bg-sky-500 px-4 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300", onClick: handleResumeBatch, children: "Keep going" })] })) : null, showCompletion ? (_jsxs("section", { className: "space-y-3 rounded-2xl bg-emerald-900/40 p-5 text-sm text-emerald-100", children: [_jsx("p", { className: "text-lg font-semibold", children: "All lemmas completed!" }), _jsx("button", { type: "button", className: "w-full rounded-full bg-emerald-400 px-4 py-2 text-base font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-200", onClick: handleReshuffle, children: "Reshuffle & restart" })] })) : null, _jsx(Settings, { apiKey: apiKey, onSave: handleSaveApiKey, onReset: handleReset }), csvData ? _jsx(CsvLoader, { onLoaded: handleCsvLoaded, existingCount: csvData.lemmas.length }) : null, modelError ? (_jsxs("div", { role: "alert", className: "fixed inset-x-4 bottom-[max(2rem,env(safe-area-inset-bottom))] z-50 space-y-3 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-sm shadow-xl", children: [_jsx("p", { className: "text-base font-semibold text-slate-100", children: "Model temporarily unavailable" }), _jsx("p", { className: "text-slate-300", children: "We couldn\u2019t reach the language model. You can retry now or skip this item. Check your API key in settings." }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", className: "flex-1 rounded-full border border-slate-700 px-4 py-2 font-semibold", onClick: handleRetryModel, children: "Retry" }), _jsx("button", { type: "button", className: "flex-1 rounded-full bg-sky-500 px-4 py-2 font-semibold text-slate-950", onClick: handleSkip, children: "Skip" })] })] })) : null] }));
};
export default App;
