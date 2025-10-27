import { useId } from 'react';
import type { EvaluationResult } from '../types';

type QuizCardProps = {
  englishPrompt: string;
  answer: string;
  status: 'pending' | 'evaluating' | 'feedback';
  attempts: number;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onNext: () => void;
  feedback?: EvaluationResult;
  targetLemma?: string;
  disableInput?: boolean;
  sourceLanguage: string;
  targetLanguage: string;
};

const QuizCard = ({
  englishPrompt,
  answer,
  status,
  attempts,
  onAnswerChange,
  onSubmit,
  onRetry,
  onNext,
  feedback,
  targetLemma,
  disableInput,
  sourceLanguage,
  targetLanguage
}: QuizCardProps) => {
  const promptId = useId();
  const textareaId = useId();
  const isEvaluating = status === 'evaluating';
  const showFeedback = status === 'feedback' && feedback;
  const disableSubmit = isEvaluating || answer.trim().length === 0 || Boolean(showFeedback);

  const answerLabel =
    targetLanguage.trim().length > 0 ? `Your answer (${targetLanguage})` : 'Your answer';

  return (
    <section className="space-y-4 rounded-2xl bg-slate-900 p-6 shadow-lg" aria-live="polite">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Translate to {targetLanguage || 'target language'}
        </p>
        <p id={promptId} className="text-lg font-semibold text-slate-100">
          {englishPrompt}
        </p>
        <p className="text-xs text-slate-400">
          Prompt language: {sourceLanguage || 'source language'}
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor={textareaId}>
          {answerLabel}
        </label>
        <textarea
          id={textareaId}
          className="min-h-[150px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-base text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          disabled={disableInput || isEvaluating}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-labelledby={promptId}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Attempts on this item: {attempts}</p>
        <button
          type="button"
          className="rounded-full bg-sky-500 px-6 py-2 text-base font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
          onClick={onSubmit}
          disabled={disableSubmit}
        >
          {isEvaluating ? 'Checking.' : 'Submit'}
        </button>
      </div>
      {showFeedback ? (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="font-semibold text-slate-100">Feedback</p>
          <p className="text-sm text-slate-200">{feedback.grammar_feedback}</p>
          <p className="text-sm text-slate-300">Improved translation: {feedback.improved_translation}</p>
          {targetLemma ? (
            <p className="text-sm text-slate-300">Target lemma: {targetLemma}</p>
          ) : null}
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {feedback.explanations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="flex-1 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
              onClick={onRetry}
            >
              Retry
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-300"
              onClick={onNext}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default QuizCard;
