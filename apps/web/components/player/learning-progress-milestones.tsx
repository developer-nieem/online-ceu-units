'use client';

import type { LearningMilestone } from '@/lib/player';

export function LearningProgressMilestones({
  milestones,
  encouragement,
}: {
  milestones: LearningMilestone[];
  encouragement: string;
}) {
  const current = milestones.find((m) => m.current) ?? milestones[0];
  const reachedCount = milestones.filter((m) => m.reached).length;

  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Progress milestone
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        {current?.label ?? 'In progress'}
      </p>
      <p className="mt-1 text-sm text-slate-600">{encouragement}</p>
      <div className="mt-3 flex gap-1" aria-hidden>
        {milestones.map((m) => (
          <span
            key={m.id}
            className={`h-1.5 flex-1 rounded-full ${
              m.reached ? 'bg-teal-600' : 'bg-slate-200'
            }`}
            title={m.label}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {reachedCount} of {milestones.length} milestones reached
      </p>
    </div>
  );
}
