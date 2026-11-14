'use client';

import { Progress } from '@calace/ui/components/ui/progress';
import { Clock, PauseCircle } from 'lucide-react';

import type { ParticipationComplianceStatus } from '@/lib/participation';

export function ParticipationMeter({
  status,
  isPaused,
  tabVisible = true,
  documentFocused = true,
  compact = false,
}: {
  status: ParticipationComplianceStatus | null;
  isPaused?: boolean;
  /** Last heartbeat tab visibility. With documentFocused, distinguishes idle from hidden/blur. */
  tabVisible?: boolean;
  documentFocused?: boolean;
  compact?: boolean;
}) {
  if (!status) return null;

  const inactivityPause = Boolean(isPaused && tabVisible && documentFocused);

  const trackedLabel = `${status.activeMinutes} min (${status.activeSeconds.toLocaleString()} sec)`;
  const label = status.seatTimeMet
    ? 'Active participation requirement met'
    : `${trackedLabel} of ${status.requiredMinutes} active minutes (${status.requiredSeconds.toLocaleString()} sec)`;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-muted-foreground"
        title={label}
        aria-label={label}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <Progress value={status.percentComplete} className="h-1.5 w-24" />
        <span>{status.percentComplete}%</span>
        {isPaused ? <PauseCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden /> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-slate-50/80 px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">Active participation</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {status.requiredMinutes} minutes required ({status.requiredSeconds} seconds) ·{' '}
            {status.minutesPerCeuHour} min per CEU hour · online delivery
          </p>
        </div>
        {isPaused ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
            <PauseCircle className="h-3 w-3" aria-hidden />
            Paused
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span>{label}</span>
          <span>{status.percentComplete}%</span>
        </div>
        <Progress
          value={status.percentComplete}
          aria-label="Active participation progress"
          className={inactivityPause ? 'opacity-50' : undefined}
        />
      </div>
      {inactivityPause ? (
        <p className="mt-2 text-xs font-medium text-amber-900">
          Paused — scroll or interact with the lesson to keep earning time.
        </p>
      ) : null}
      {!status.seatTimeMet ? (
        <p className="mt-2 text-xs text-muted-foreground">
          About {status.remainingMinutes} minute{status.remainingMinutes === 1 ? '' : 's'} (
          {status.remainingSeconds.toLocaleString()} seconds) remaining to meet the California CDPH
          mandate. Time accrues while you read and interact with lessons (tab active, not idle).
        </p>
      ) : (
        <p className="mt-2 text-xs text-teal-800">You may proceed to the final exam when other requirements are met.</p>
      )}
    </div>
  );
}
