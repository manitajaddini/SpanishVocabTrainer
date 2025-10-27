import { useEffect, useState } from 'react';
import type { ModelOption } from '../config/models';
import type { LanguagePair } from '../types';

const Settings = ({
  apiKey,
  model,
  models,
  onSave,
  onReset,
  onModelChange,
  languages,
  detectedLanguages,
  onLanguageSave
}: {
  apiKey: string;
  model: string;
  models: readonly ModelOption[];
  onSave: (key: string) => void;
  onReset: () => void;
  onModelChange: (value: string) => void;
  languages: LanguagePair;
  detectedLanguages: LanguagePair;
  onLanguageSave: (value: LanguagePair) => void;
}) => {
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

  const handleModelChange = (next: string) => {
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

  return (
    <section className="space-y-4 rounded-2xl bg-slate-900 p-4 text-sm shadow-inner">
      <h2 className="text-lg font-semibold">Settings</h2>
      <div className="space-y-2">
        <label className="block text-xs uppercase text-slate-400" htmlFor="openai-key">
          OpenAI API key
        </label>
        <div className="flex items-center gap-2">
          <input
            id="openai-key"
            type={showKey ? 'text' : 'password'}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium"
            onClick={() => setShowKey((prev) => !prev)}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          type="button"
          className="w-full rounded-lg bg-sky-500 px-3 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300"
          onClick={() => onSave(value.trim())}
        >
          Save key
        </button>
        <p className="text-xs text-slate-400">
          Stored locally; used only for language model calls.
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-xs uppercase text-slate-400" htmlFor="model-select">
          Model
        </label>
        <select
          id="model-select"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={selectedModel}
          onChange={(event) => handleModelChange(event.target.value)}
        >
          {models.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {activeModel?.helper ? <p className="text-xs text-slate-400">{activeModel.helper}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="block text-xs uppercase text-slate-400" htmlFor="target-language">
          Languages
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Target (answer language)</p>
            <input
              id="target-language"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              placeholder={detectedLanguages.target || 'e.g., Spanish'}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Prompt (question language)</p>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={sourceValue}
              onChange={(event) => setSourceValue(event.target.value)}
              placeholder={detectedLanguages.source || 'e.g., English'}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Leave blank to use CSV headers (Detected: {detectedLabel})
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg bg-sky-500 px-3 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300"
            onClick={handleLanguageSubmit}
          >
            Save languages
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            onClick={handleUseDetected}
          >
            Use detected
          </button>
        </div>
      </div>
      <button
        type="button"
        className="w-full rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
        onClick={onReset}
      >
        Reset progress
      </button>
    </section>
  );
};

export default Settings;
