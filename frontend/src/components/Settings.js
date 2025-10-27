import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const Settings = ({ apiKey, model, models, onSave, onReset, onModelChange, languages, detectedLanguages, onLanguageSave }) => {
    const [value, setValue] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState(model);
    const [sourceValue, setSourceValue] = useState(languages.source);
    const [targetValue, setTargetValue] = useState(languages.target);
    useEffect(() => {
        setValue(apiKey);
    }, [apiKey]);
    useEffect(() => {
        setSelectedModel(model);
    }, [model]);
    useEffect(() => {
        setSourceValue(languages.source);
        setTargetValue(languages.target);
    }, [languages]);
    const handleModelChange = (next) => {
        setSelectedModel(next);
        onModelChange(next);
    };
    const activeModel = models.find((option) => option.value === selectedModel);
    const detectedLabel = `${detectedLanguages.target || 'Target'} → ${detectedLanguages.source || 'Source'}`;
    const handleLanguageSubmit = () => {
        onLanguageSave({
            source: sourceValue.trim(),
            target: targetValue.trim()
        });
    };
    const handleUseDetected = () => {
        setSourceValue(detectedLanguages.source);
        setTargetValue(detectedLanguages.target);
        onLanguageSave({
            source: detectedLanguages.source.trim(),
            target: detectedLanguages.target.trim()
        });
    };
    return (_jsxs("section", { className: "space-y-4 rounded-2xl bg-slate-900 p-4 text-sm shadow-inner", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Settings" }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-xs uppercase text-slate-400", htmlFor: "openai-key", children: "OpenAI API key" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { id: "openai-key", type: showKey ? 'text' : 'password', className: "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500", value: value, onChange: (event) => setValue(event.target.value), autoCapitalize: "off", autoCorrect: "off", spellCheck: false }), _jsx("button", { type: "button", className: "rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium", onClick: () => setShowKey((prev) => !prev), children: showKey ? 'Hide' : 'Show' })] }), _jsx("button", { type: "button", className: "w-full rounded-lg bg-sky-500 px-3 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300", onClick: () => onSave(value.trim()), children: "Save key" }), _jsx("p", { className: "text-xs text-slate-400", children: "Stored locally; used only for language model calls." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-xs uppercase text-slate-400", htmlFor: "model-select", children: "Model" }), _jsx("select", { id: "model-select", className: "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500", value: selectedModel, onChange: (event) => handleModelChange(event.target.value), children: models.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), activeModel?.helper ? _jsx("p", { className: "text-xs text-slate-400", children: activeModel.helper }) : null] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-xs uppercase text-slate-400", htmlFor: "target-language", children: "Languages" }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-slate-400", children: "Target (answer language)" }), _jsx("input", { id: "target-language", className: "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500", value: targetValue, onChange: (event) => setTargetValue(event.target.value), placeholder: detectedLanguages.target || 'e.g., Spanish' })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-slate-400", children: "Prompt (question language)" }), _jsx("input", { className: "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500", value: sourceValue, onChange: (event) => setSourceValue(event.target.value), placeholder: detectedLanguages.source || 'e.g., English' })] })] }), _jsxs("p", { className: "text-xs text-slate-400", children: ["Leave blank to use CSV headers (Detected: ", detectedLabel, ")"] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", className: "flex-1 rounded-lg bg-sky-500 px-3 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300", onClick: handleLanguageSubmit, children: "Save languages" }), _jsx("button", { type: "button", className: "flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400", onClick: handleUseDetected, children: "Use detected" })] })] }), _jsx("button", { type: "button", className: "w-full rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300", onClick: onReset, children: "Reset progress" })] }));
};
export default Settings;
