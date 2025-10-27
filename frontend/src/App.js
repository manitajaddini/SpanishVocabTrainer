import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import CsvLoader from './components/CsvLoader';
import QuizCard from './components/QuizCard';
import ScorePanel from './components/ScorePanel';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import InsightsPanel from './components/InsightsPanel';
import { MODEL_OPTIONS } from './config/models';
import { generatePrompt, evaluateAnswer, ApiError } from './lib/openai';
import { createInitialQueue, getCurrentLemma, isExhausted, markLemmaUsed, reshuffle, skipCurrentLemma } from './lib/scheduler';
import { clearState, loadState, saveState } from './lib/storage';
import { averageAttemptsPerItem, batchAccuracy, createInitialScoreState, recordEvaluation, resetBatch, accuracy, summarizeExplanations } from './lib/scoring';
import { shouldAdvance } from './lib/evaluation';
import { createInitialInsightState, recordOutcome, recentAccuracy as insightRecentAccuracy, hardestLemmas, totalAttemptsTracked } from './lib/insights';
const CSV_STORAGE = { key: 'csv-data', version: 1 };
const QUEUE_STORAGE = { key: 'queue', version: 1 };
const SCORE_STORAGE = { key: 'score', version: 1 };
const PROGRESS_STORAGE = { key: 'progress', version: 1 };
const CURRENT_STORAGE = { key: 'current', version: 1 };
const API_KEY_STORAGE = { key: 'api-key', version: 1 };
const MODEL_STORAGE = { key: 'model', version: 1 };
const ONBOARDING_STORAGE = { key: 'onboarding', version: 1 };
const INSIGHTS_STORAGE = { key: 'insights', version: 1 };
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
    const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [insights, setInsights] = useState(createInitialInsightState);
    const dismissOnboarding = () => {
        saveState(ONBOARDING_STORAGE, true);
        setShowOnboarding(false);
    };
    const reopenOnboarding = () => {
        saveState(ONBOARDING_STORAGE, false);
        setShowOnboarding(true);
    };
    const vibrate = (pattern) => {
        if (typeof window === 'undefined')
            return;
        const nav = window.navigator;
        if (typeof nav?.vibrate !== 'function')
            return;
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        try {
            nav.vibrate(pattern);
        }
        catch {
            // noop
        }
    };
    useEffect(() => {
        const storedKey = loadState(API_KEY_STORAGE);
        if (storedKey)
            setApiKey(storedKey);
        const storedModel = loadState(MODEL_STORAGE);
        if (storedModel)
            setSelectedModel(storedModel);
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
        const onboardingSeen = loadState(ONBOARDING_STORAGE);
        setShowOnboarding(onboardingSeen !== true);
        const storedInsights = loadState(INSIGHTS_STORAGE);
        if (storedInsights)
            setInsights(storedInsights);
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
        saveState(MODEL_STORAGE, selectedModel);
    }, [selectedModel]);
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
    useEffect(() => {
        saveState(INSIGHTS_STORAGE, insights);
    }, [insights]);
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
            const prompt = await generatePrompt(lemma, { apiKey, model: selectedModel });
            const item = {
                lemma,
                englishPrompt: prompt,
                status: 'pending',
                attempts: 0
            };
            setCurrentItem(item);
            setAnswer('');
            if (showOnboarding) {
                dismissOnboarding();
            }
        }
        catch (error) {
            console.error(error);
            const apiError = error instanceof ApiError ? error : null;
            setModelError({
                action: 'generate',
                lemma,
                payload: {},
                message: apiError?.message ?? (error instanceof Error ? error.message : 'Model temporarily unavailable'),
                detail: apiError?.detail,
                status: apiError?.status,
                code: apiError?.code
            });
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
        setInsights(createInitialInsightState());
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
            const result = await evaluateAnswer(lemma, englishPrompt, answer, { apiKey, model: selectedModel });
            setScoreState((prev) => recordEvaluation(prev, result.score_delta, result.is_correct_meaning, result.explanations));
            const shouldMove = shouldAdvance(result);
            setInsights((prev) => recordOutcome(prev, lemma, shouldMove));
            vibrate(shouldMove ? 30 : [40, 35, 40]);
            if (shouldMove) {
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
                },
                message: error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                        ? error.message
                        : 'Model temporarily unavailable',
                detail: error instanceof ApiError ? error.detail : undefined,
                status: error instanceof ApiError ? error.status : undefined,
                code: error instanceof ApiError ? error.code : undefined
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
    const handleModelSelect = (value) => {
        const match = MODEL_OPTIONS.find((option) => option.value === value);
        setSelectedModel((match ?? MODEL_OPTIONS[0]).value);
    };
    const handleReset = () => {
        [
            CSV_STORAGE.key,
            QUEUE_STORAGE.key,
            SCORE_STORAGE.key,
            PROGRESS_STORAGE.key,
            CURRENT_STORAGE.key,
            INSIGHTS_STORAGE.key
        ].forEach((key) => clearState(key));
        setCsvData(null);
        setQueue(null);
        setScoreState(createInitialScoreState());
        setProgress(initialProgress);
        setCurrentItem(null);
        setAnswer('');
        setBatchSummary(null);
        setView('welcome');
        setInsights(createInitialInsightState());
        reopenOnboarding();
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
    const activeModel = useMemo(() => MODEL_OPTIONS.find((option) => option.value === selectedModel) ?? MODEL_OPTIONS[0], [selectedModel]);
    const insightAccuracyValue = insightRecentAccuracy(insights);
    const focusList = useMemo(() => hardestLemmas(insights), [insights]);
    const attemptsTracked = totalAttemptsTracked(insights);
    const issueHighlights = useMemo(() => summarizeExplanations(scoreState.explanations), [scoreState.explanations]);
    const showCompletion = queue ? isExhausted(queue) && !getCurrentLemma(queue) : false;
    return (_jsxs("main", { className: "mx-auto flex min-h-[100svh] max-w-3xl flex-col gap-6 p-4 pb-[max(4rem,env(safe-area-inset-bottom))]", children: [_jsxs("header", { className: "space-y-2 pt-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Spanish Lemma Trainer" }), _jsx("p", { className: "text-sm text-slate-300", children: "Practice every lemma exactly once per cycle. Progress lives on this device." })] }), view === 'welcome' ? _jsx(CsvLoader, { onLoaded: handleCsvLoaded }) : null, view === 'quiz' && csvData && queue ? (_jsxs("div", { className: "space-y-4", children: [_jsx(ScorePanel, { lemmasLeft: lemmasLeft, totalLemmas: totalLemmas, usedCount: usedCount, batchProgress: batchProgress, totalScore: scoreState.totalScore, batchScore: scoreState.batchScore, accuracy: acc, attempts: scoreState.attempts, avgAttempts: avgAttempts }), _jsx(InsightsPanel, { streak: insights.streak, bestStreak: insights.bestStreak, recentAccuracy: insightAccuracyValue, totalTracked: attemptsTracked, hardLemmas: focusList, issueHighlights: issueHighlights }), currentItem ? (_jsx(QuizCard, { englishPrompt: currentItem.englishPrompt, answer: answer, status: currentItem.status, attempts: currentItem.attempts, onAnswerChange: setAnswer, onSubmit: handleSubmit, onRetry: handleRetryFeedback, onNext: handleNextAfterFeedback, feedback: currentItem.lastResult, targetLemma: currentItem.status === 'feedback' ? currentItem.lemma : undefined, disableInput: loadingPrompt })) : (_jsx("div", { className: "rounded-2xl bg-slate-900 p-6 text-center text-sm text-slate-300", children: loadingPrompt ? 'Loading next item…' : 'Select “Reshuffle & restart” once you finish this cycle.' }))] })) : null, view === 'batch-summary' && batchSummary ? (_jsxs("section", { className: "space-y-4 rounded-2xl bg-slate-900 p-6 text-sm shadow-lg", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Batch complete!" }), _jsxs("p", { children: ["Batch score: ", batchSummary.score] }), _jsxs("p", { children: ["Accuracy this batch: ", batchSummary.accuracy, "%"] }), _jsxs("p", { children: ["Attempts this batch: ", batchSummary.attempts] }), batchSummary.issues.length > 0 ? (_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-200", children: "Common themes" }), _jsx("ul", { className: "list-disc space-y-1 pl-5 text-slate-300", children: batchSummary.issues.map((issue) => (_jsx("li", { children: issue }, issue))) })] })) : null, _jsx("p", { className: "text-slate-300", children: "Great work\u2014keep your streak going!" }), _jsx("button", { type: "button", className: "w-full rounded-full bg-sky-500 px-4 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300", onClick: handleResumeBatch, children: "Keep going" })] })) : null, showCompletion ? (_jsxs("section", { className: "space-y-3 rounded-2xl bg-emerald-900/40 p-5 text-sm text-emerald-100", children: [_jsx("p", { className: "text-lg font-semibold", children: "All lemmas completed!" }), _jsx("button", { type: "button", className: "w-full rounded-full bg-emerald-400 px-4 py-2 text-base font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-200", onClick: handleReshuffle, children: "Reshuffle & restart" })] })) : null, _jsx(Settings, { apiKey: apiKey, model: selectedModel, models: MODEL_OPTIONS, onSave: handleSaveApiKey, onReset: handleReset, onModelChange: handleModelSelect }), csvData ? _jsx(CsvLoader, { onLoaded: handleCsvLoaded, existingCount: csvData.lemmas.length }) : null, modelError ? (_jsxs("div", { role: "alert", className: "fixed inset-x-4 bottom-[max(2rem,env(safe-area-inset-bottom))] z-50 space-y-3 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-sm shadow-xl", children: [_jsx("p", { className: "text-base font-semibold text-slate-100", children: modelError.message || 'Model temporarily unavailable' }), _jsx("p", { className: "text-slate-300", children: modelError.detail ?? 'OpenAI did not accept the request. Retry, switch models, or double-check your API key.' }), _jsxs("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: [modelError.status ? `Status ${modelError.status}` : 'Status unknown', modelError.code ? ` · ${modelError.code}` : '', " \u00B7 Model ", activeModel.label] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", className: "flex-1 rounded-full border border-slate-700 px-4 py-2 font-semibold", onClick: handleRetryModel, children: "Retry" }), _jsx("button", { type: "button", className: "flex-1 rounded-full bg-sky-500 px-4 py-2 font-semibold text-slate-950", onClick: handleSkip, children: "Skip" })] })] })) : null, showOnboarding ? (_jsx(Onboarding, { hasDeck: Boolean(csvData), hasApiKey: apiKey.trim().length > 0, modelLabel: activeModel.label, onStart: dismissOnboarding, onSkip: () => setShowOnboarding(false) })) : null] }));
};
export default App;
