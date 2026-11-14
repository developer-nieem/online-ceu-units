'use client';

import { cn } from '@calace/ui/lib/utils';
import { CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { useState } from 'react';

export type TrueFalseChallengeProps = {
  question: string;
  isTrue: boolean;
  explanation: string;
  /** When true, the challenge is already completed and locked in the success state. */
  locked?: boolean;
  /** Previously selected answer when restoring completed state. */
  initialAnswer?: boolean;
  onAnswer?: (params: { answer: boolean; correct: boolean }) => void;
};

type Outcome = 'idle' | 'incorrect' | 'correct';

export function TrueFalseChallenge({
  question,
  isTrue,
  explanation,
  locked = false,
  initialAnswer,
  onAnswer,
}: TrueFalseChallengeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(
    locked && initialAnswer != null ? initialAnswer : null,
  );
  const [outcome, setOutcome] = useState<Outcome>(locked ? 'correct' : 'idle');

  const isLocked = locked || outcome === 'correct';

  function handleSelect(answer: boolean) {
    if (isLocked) return;

    setSelectedAnswer(answer);

    if (answer === isTrue) {
      setOutcome('correct');
      onAnswer?.({ answer, correct: true });
      return;
    }

    setOutcome('incorrect');
  }

  function tryAgain() {
    if (isLocked) return;
    setSelectedAnswer(null);
    setOutcome('idle');
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 p-5 shadow-sm transition-colors',
        outcome === 'correct'
          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-teal-50/80'
          : outcome === 'incorrect'
            ? 'border-red-300 bg-gradient-to-br from-red-50 via-white to-rose-50/60'
            : 'border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/50',
      )}
      role="group"
      aria-labelledby="true-false-challenge-prompt"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl"
        aria-hidden
      />

      <div className="relative mb-5 flex items-start gap-3">
        {outcome === 'correct' ? (
          <CheckCircle2
            className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600"
            aria-hidden
          />
        ) : (
          <Sparkles
            className="mt-0.5 h-6 w-6 shrink-0 text-violet-600"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            id="true-false-challenge-prompt"
            className="text-xs font-bold uppercase tracking-widest text-violet-700/80"
          >
            True or False Challenge
          </p>
          <p className="mt-2 text-base font-semibold leading-relaxed text-slate-900">
            {question}
          </p>
        </div>
      </div>

      <div
        className="relative grid grid-cols-2 gap-3"
        role="group"
        aria-label="Choose True or False"
      >
        {([true, false] as const).map((value) => {
          const label = value ? 'True' : 'False';
          const isSelected = selectedAnswer === value;
          const isCorrectChoice = value === isTrue;
          const showAsCorrect = isLocked && isCorrectChoice;
          const showAsWrong =
            outcome === 'incorrect' && isSelected && !isCorrectChoice;

          return (
            <button
              key={label}
              type="button"
              disabled={isLocked}
              aria-pressed={isSelected}
              onClick={() => handleSelect(value)}
              className={cn(
                'rounded-xl border-2 px-4 py-4 text-center text-base font-bold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                showAsCorrect
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : showAsWrong
                    ? 'border-red-500 bg-red-500 text-white shadow-md shadow-red-200'
                    : isSelected && outcome === 'idle'
                      ? 'border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-200'
                      : 'border-violet-200 bg-white text-violet-950 hover:border-violet-400 hover:bg-violet-50',
                isLocked && !showAsCorrect && 'opacity-50',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {outcome === 'incorrect' ? (
        <div
          className="relative mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-white/90 px-4 py-3"
          role="status"
        >
          <div className="flex items-start gap-2 text-sm font-medium text-red-900">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>Not quite — read the statement carefully and try again.</span>
          </div>
          <button
            type="button"
            onClick={tryAgain}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-900 transition-colors hover:bg-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Try again
          </button>
        </div>
      ) : null}

      {outcome === 'correct' ? (
        <div
          className="relative mt-4 rounded-xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          <p className="flex items-center gap-2 font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            Correct!
          </p>
          <p className="mt-2 leading-relaxed">{explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
