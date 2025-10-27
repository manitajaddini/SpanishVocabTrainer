import ProgressBar from './ProgressBar';

type ScorePanelProps = {
  lemmasLeft: number;
  totalLemmas: number;
  usedCount: number;
  batchProgress: number;
  totalScore: number;
  batchScore: number;
  accuracy: number;
  attempts: number;
  avgAttempts: number;
};

const ScorePanel = ({
  lemmasLeft,
  totalLemmas,
  usedCount,
  batchProgress,
  totalScore,
  batchScore,
  accuracy,
  attempts,
  avgAttempts
}: ScorePanelProps) => (
  <section className="space-y-3 rounded-2xl bg-slate-900 p-4 text-sm shadow-inner">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-semibold">Lemmas left: {lemmasLeft} / Total: {totalLemmas}</p>
      <p className="text-slate-300">Used: {usedCount}</p>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-slate-300">
        <span>Batch progress</span>
        <span>{batchProgress} / 10</span>
      </div>
      <ProgressBar value={batchProgress} max={10} />
    </div>
    <div className="grid grid-cols-2 gap-3 text-slate-200 sm:grid-cols-4">
      <div>
        <p className="text-xs uppercase text-slate-400">Total score</p>
        <p className="text-lg font-semibold">{totalScore}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-400">Batch score</p>
        <p className="text-lg font-semibold">{batchScore}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-400">Accuracy</p>
        <p className="text-lg font-semibold">{accuracy}%</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-400">Attempts</p>
        <p className="text-lg font-semibold">{attempts}</p>
        <p className="text-xs text-slate-400">Avg {avgAttempts}</p>
      </div>
    </div>
  </section>
);

export default ScorePanel;
