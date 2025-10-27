import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Onboarding = ({ hasDeck, hasApiKey, modelLabel, languageLabel, onStart, onSkip }) => {
    const steps = [
        {
            id: 'deck',
            title: 'Upload your CSV deck',
            description: 'Use the uploader below to load your lemmas. Progress stays on this device.',
            done: hasDeck
        },
        {
            id: 'key',
            title: 'Save your OpenAI key',
            description: 'Paste your key in Settings so requests go directly from this device to OpenAI.',
            done: hasApiKey
        },
        {
            id: 'model',
            title: 'Confirm languages & model',
            description: `Practicing with ${languageLabel}. Model: ${modelLabel}. Adjust anytime in Settings.`,
            done: hasDeck && hasApiKey
        }
    ];
    const ready = hasDeck && hasApiKey;
    return (_jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm", children: _jsxs("div", { className: "w-full max-w-lg space-y-5 rounded-3xl border border-slate-700/80 bg-slate-900 p-6 text-sm text-slate-100 shadow-2xl", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Welcome" }), _jsx("h2", { className: "text-2xl font-semibold text-slate-100", children: "Getting started" }), _jsx("p", { className: "text-slate-300", children: "Follow these quick steps to start your first practice batch." })] }), _jsx("ol", { className: "space-y-3", children: steps.map((step, index) => {
                        const isDone = step.done;
                        return (_jsxs("li", { className: "flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3", children: [_jsx("span", { className: `flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${isDone ? 'border-emerald-400/80 text-emerald-300' : 'border-slate-600 text-slate-300'}`, children: isDone ? '✓' : index + 1 }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsx("p", { className: "font-semibold text-slate-100", children: step.title }), _jsx("p", { className: "text-slate-300", children: step.description })] })] }, step.id));
                    }) }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("button", { type: "button", className: "flex-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50", onClick: onStart, disabled: !ready, children: "Start practicing" }), _jsx("button", { type: "button", className: "flex-1 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400", onClick: onSkip, children: "Skip for now" })] }), !ready ? (_jsx("p", { className: "text-xs text-slate-400", children: "Upload your CSV and save an API key to enable the full experience. Reset progress later to reopen this guide." })) : null] }) }));
};
export default Onboarding;
