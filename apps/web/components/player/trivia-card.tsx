'use client';

import { Button } from '@calace/ui/components/ui/button';
import { cn } from '@calace/ui/lib/utils';
import { CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import { useState } from 'react';

export type TriviaCardProps = {
  title: string;
  fact: string;
  /** When true, the card is already revealed and marked complete. */
  locked?: boolean;
  onComplete?: () => void;
};

export function TriviaCard({
  title,
  fact,
  locked = false,
  onComplete,
}: TriviaCardProps) {
  const [revealed, setRevealed] = useState(locked);
  const [completed, setCompleted] = useState(locked);

  function handleReveal() {
    if (completed || revealed) return;
    setRevealed(true);
  }

  function handleGotIt() {
    if (completed) return;
    setCompleted(true);
    onComplete?.();
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 p-1 shadow-sm transition-colors duration-500',
        completed
          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-amber-50/60'
          : 'border-amber-300 bg-gradient-to-br from-amber-50 via-sky-50/70 to-indigo-50/50',
      )}
      role="region"
      aria-label={title}
    >
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-sky-200/35 blur-2xl"
        aria-hidden
      />

      <div className="relative [perspective:1000px]">
        <div
          className={cn(
            'relative min-h-[9rem] transition-transform duration-700 ease-in-out [transform-style:preserve-3d]',
            revealed ? '[transform:rotateY(180deg)]' : '',
          )}
        >
          {/* Front */}
          <div
            className={cn(
              'inset-0 rounded-xl p-5 [backface-visibility:hidden]',
              revealed ? 'pointer-events-none absolute opacity-0' : 'relative',
            )}
          >
            <div className="flex items-start gap-3">
              <Lightbulb
                className="mt-0.5 h-6 w-6 shrink-0 text-amber-600"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700/80">
                  Did You Know?
                </p>
                <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900">
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReveal}
              disabled={completed}
              aria-expanded={revealed}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-200/80',
                'bg-white/90 px-4 py-3 text-sm font-semibold text-amber-950 shadow-sm',
                'transition-all hover:border-amber-400 hover:bg-amber-50/80 hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
              )}
            >
              <Sparkles className="h-4 w-4 text-amber-600" aria-hidden />
              Click to reveal
            </button>
          </div>

          {/* Back */}
          <div
            className={cn(
              'rounded-xl p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]',
              revealed ? 'relative' : 'pointer-events-none absolute inset-0 opacity-0',
            )}
          >
            <div className="flex items-start gap-3">
              {completed ? (
                <CheckCircle2
                  className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600"
                  aria-hidden
                />
              ) : (
                <Lightbulb
                  className="mt-0.5 h-6 w-6 shrink-0 text-amber-600"
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700/80">
                  {title}
                </p>
                <p
                  className="mt-3 text-sm leading-relaxed text-slate-800"
                  role="status"
                >
                  {fact}
                </p>
              </div>
            </div>

            {!completed ? (
              <Button
                type="button"
                size="sm"
                className="mt-5 w-full bg-amber-600 font-semibold text-white hover:bg-amber-700"
                onClick={handleGotIt}
              >
                Got it
              </Button>
            ) : (
              <p
                className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-emerald-800"
                role="status"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Saved — nice work!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
