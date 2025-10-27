type InsightsPanelProps = {
  streak: number;
  bestStreak: number;
  recentAccuracy: number;
  totalTracked: number;
  hardLemmas: Array<{ lemma: string; count: number }>;
  issueHighlights: string[];
};

const InsightsPanel = ({
  streak,
  bestStreak,
  recentAccuracy,
  totalTracked,
  hardLemmas,
  issueHighlights
}: InsightsPanelProps) => {
  const hasData = totalTracked > 0;

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 shadow-inner">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Memory insights</h2>
        <p className="text-xs text-slate-400">{hasData ? `${totalTracked} attempts tracked` : 'Start a batch to unlock'}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-xs uppercase text-slate-400">Current streak</p>
          <p className="text-2xl font-semibold text-slate-100">{streak}</p>
          <p className="text-xs text-slate-400">Best {bestStreak}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-xs uppercase text-slate-400">Recent accuracy</p>
          <p className="text-2xl font-semibold text-slate-100">{hasData ? `${recentAccuracy}%` : '–'}</p>
          <p className="text-xs text-slate-400">Last 10 attempts</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-xs uppercase text-slate-400">Focus next</p>
          {hardLemmas.length > 0 ? (
            <ul className="space-y-1">
              {hardLemmas.map((item) => (
                <li key={item.lemma} className="flex items-center justify-between text-sm text-slate-200">
                  <span>{item.lemma}</span>
                  <span className="text-xs text-slate-400">{item.count} misses</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Great coverage so far.</p>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
        <p className="text-xs uppercase text-slate-400">Common issues</p>
        {issueHighlights.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-200">
            {issueHighlights.map((issue) => (
              <li key={issue}>• {issue}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Feedback will appear here after a few evaluations.</p>
        )}
      </div>
    </section>
  );
};

export default InsightsPanel;
