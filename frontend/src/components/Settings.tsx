import { useEffect, useState } from 'react';
import type { ModelOption } from '../config/models';

const Settings = ({
  apiKey,
  model,
  models,
  onSave,
  onReset,
  onModelChange
}: {
  apiKey: string;
  model: string;
  models: readonly ModelOption[];
  onSave: (key: string) => void;
  onReset: () => void;
  onModelChange: (value: string) => void;
}) => {
  const [value, setValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(model);

  useEffect(() => {
    setValue(apiKey);
  }, [apiKey]);

  useEffect(() => {
    setSelectedModel(model);
  }, [model]);

  const handleModelChange = (next: string) => {
    setSelectedModel(next);
    onModelChange(next);
  };

  const activeModel = models.find((option) => option.value === selectedModel);

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
