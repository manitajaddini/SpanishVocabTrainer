type OnboardingProps = {
  hasDeck: boolean;
  hasApiKey: boolean;
  modelLabel: string;
  onStart: () => void;
  onSkip: () => void;
};

const Onboarding = ({ hasDeck, hasApiKey, modelLabel, onStart, onSkip }: OnboardingProps) => {
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
      title: 'Choose your model',
      description: `Currently selected: ${modelLabel}. You can switch anytime in Settings.`,
      done: hasDeck && hasApiKey
    }
  ] as const;

  const ready = hasDeck && hasApiKey;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-5 rounded-3xl border border-slate-700/80 bg-slate-900 p-6 text-sm text-slate-100 shadow-2xl">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Welcome</p>
          <h2 className="text-2xl font-semibold text-slate-100">Getting started</h2>
          <p className="text-slate-300">Follow these quick steps to start your first practice batch.</p>
        </div>
        <ol className="space-y-3">
          {steps.map((step, index) => {
            const isDone = step.done;
            return (
              <li key={step.id} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                    isDone ? 'border-emerald-400/80 text-emerald-300' : 'border-slate-600 text-slate-300'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </span>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-100">{step.title}</p>
                  <p className="text-slate-300">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
            onClick={onStart}
            disabled={!ready}
          >
            Start practicing
          </button>
          <button
            type="button"
            className="flex-1 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            onClick={onSkip}
          >
            Skip for now
          </button>
        </div>
        {!ready ? (
          <p className="text-xs text-slate-400">
            Upload your CSV and save an API key to enable the full experience. Reset progress later to reopen this guide.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Onboarding;
