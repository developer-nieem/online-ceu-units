'use client';

import { cn } from '@calace/ui/lib/utils';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

export type KnowledgeCheckProps = {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  /** When true, the check is already completed and locked in the success state. */
  locked?: boolean;
  /** Previously selected option index when restoring completed state. */
  initialSelectedIndex?: number;
  onAnswer?: (params: { optionIndex: number; correct: boolean }) => void;
};

type Outcome = 'idle' | 'incorrect' | 'correct';

export function KnowledgeCheck({
  question,
  options,
  correctOptionIndex,
  explanation,
  locked = false,
  initialSelectedIndex,
  onAnswer,
}: KnowledgeCheckProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    locked && initialSelectedIndex != null ? initialSelectedIndex : null,
  );
  const [outcome, setOutcome] = useState<Outcome>(
    locked ? 'correct' : 'idle',
  );

  const isLocked = locked || outcome === 'correct';

  function handleSelect(index: number) {
    if (isLocked) return;

    setSelectedIndex(index);

    if (index === correctOptionIndex) {
      setOutcome('correct');
      onAnswer?.({ optionIndex: index, correct: true });
      return;
    }

    setOutcome('incorrect');
  }

  function tryAgain() {
    if (isLocked) return;
    setSelectedIndex(null);
    setOutcome('idle');
  }

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 transition-colors',
        outcome === 'correct'
          ? 'border-emerald-300 bg-emerald-50/80'
          : outcome === 'incorrect'
            ? 'border-red-200 bg-red-50/60'
            : 'border-amber-200 bg-amber-50/50',
      )}
      role="group"
      aria-labelledby="knowledge-check-prompt"
    >
      <div className="mb-4 flex items-start gap-2">
        {outcome === 'correct' ? (
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
        ) : (
          <HelpCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            id="knowledge-check-prompt"
            className="text-xs font-semibold uppercase tracking-wide text-amber-900/70"
          >
            Knowledge check
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">
            {question}
          </p>
        </div>
      </div>

      <div className="space-y-2" role="listbox" aria-label="Answer choices">
        {options.map((label, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectOption = index === correctOptionIndex;
          const showAsCorrect = isLocked && isCorrectOption;
          const showAsWrong =
            outcome === 'incorrect' && isSelected && !isCorrectOption;

          return (
            <button
              key={index}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={isLocked}
              onClick={() => handleSelect(index)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2',
                showAsCorrect
                  ? 'border-emerald-400 bg-emerald-100/80 font-medium text-emerald-950'
                  : showAsWrong
                    ? 'border-red-400 bg-red-100/80 text-red-950'
                    : isSelected && outcome === 'idle'
                      ? 'border-teal-400 bg-teal-50 text-teal-950'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-teal-300 hover:bg-teal-50/40',
                isLocked && !showAsCorrect && 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  showAsCorrect
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : showAsWrong
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-600',
                )}
                aria-hidden
              >
                {showAsCorrect ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : showAsWrong ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </span>
              <span className="leading-relaxed">{label}</span>
            </button>
          );
        })}
      </div>

      {outcome === 'incorrect' ? (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-white/80 px-4 py-3"
          role="status"
        >
          <div className="flex items-start gap-2 text-sm text-red-900">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Not quite — review the scenario and choose the best response for
              a CNA.
            </span>
          </div>
          <button
            type="button"
            onClick={tryAgain}
            className="shrink-0 rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-900 transition-colors hover:bg-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Try again
          </button>
        </div>
      ) : null}

      {outcome === 'correct' ? (
        <div
          className="mt-4 rounded-lg border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          <p className="font-semibold text-emerald-800">Correct!</p>
          {explanation ? (
            <p className="mt-1 leading-relaxed">{explanation}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
