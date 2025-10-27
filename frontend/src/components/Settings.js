import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const Settings = ({ apiKey, onSave, onReset }) => {
    const [value, setValue] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);
    useEffect(() => {
        setValue(apiKey);
    }, [apiKey]);
    return (_jsxs("section", { className: "space-y-4 rounded-2xl bg-slate-900 p-4 text-sm shadow-inner", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Settings" }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-xs uppercase text-slate-400", htmlFor: "openai-key", children: "OpenAI API key" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { id: "openai-key", type: showKey ? 'text' : 'password', className: "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500", value: value, onChange: (event) => setValue(event.target.value), autoCapitalize: "off", autoCorrect: "off", spellCheck: false }), _jsx("button", { type: "button", className: "rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium", onClick: () => setShowKey((prev) => !prev), children: showKey ? 'Hide' : 'Show' })] }), _jsx("button", { type: "button", className: "w-full rounded-lg bg-sky-500 px-3 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300", onClick: () => onSave(value.trim()), children: "Save key" }), _jsx("p", { className: "text-xs text-slate-400", children: "Stored locally; used only for language model calls." })] }), _jsx("button", { type: "button", className: "w-full rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300", onClick: onReset, children: "Reset progress" })] }));
};
export default Settings;
