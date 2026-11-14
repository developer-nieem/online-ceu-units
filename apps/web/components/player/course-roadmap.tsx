'use client';

import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';

import type { CompletionRoadmapStep } from '@/lib/player';
import type { ParticipationComplianceStatus } from '@/lib/participation';

export function CourseRoadmap({
  steps,
  courseSlug,
  progressPct,
  participation,
  examEligible,
}: {
  steps: CompletionRoadmapStep[];
  courseSlug: string;
  progressPct: number;
  participation?: ParticipationComplianceStatus;
  examEligible?: boolean;
}) {
  const lessonsDone = progressPct >= 88;
  const participationDone = participation?.seatTimeMet ?? false;

  function stepDone(step: CompletionRoadmapStep): boolean {
    switch (step.id) {
      case 'lessons':
        return lessonsDone;
      case 'participation':
        return participationDone;
      case 'final-exam':
        // Eligibility means "ready to take", not completed — keep the exam link visible.
        return false;
      default:
        return false;
    }
  }

  return (
    <nav
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Course completion roadmap"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Course roadmap
      </p>
      <ol className="mt-3 space-y-2">
        {steps.map((step) => {
          const done = stepDone(step);
          const href =
            step.href ??
            (step.id === 'final-exam' ? `/courses/${courseSlug}/exam` : undefined);
          const examReady =
            step.id === 'final-exam' &&
            examEligible === true &&
            participationDone &&
            lessonsDone;
          return (
            <li key={step.id} className="flex gap-2 text-sm">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              )}
              <div className="min-w-0">
                {href ? (
                  <Link href={href} className="font-medium text-teal-800 underline">
                    {step.order}. {step.label}
                    {examReady ? ' — ready' : ''}
                  </Link>
                ) : (
                  <p className="font-medium text-slate-900">
                    {step.order}. {step.label}
                  </p>
                )}
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
