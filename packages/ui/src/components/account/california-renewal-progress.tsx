import {
  CALIFORNIA_RENEWAL_ADDITIONAL_HOURS_NOTE,
  CALIFORNIA_RENEWAL_GUIDANCE,
  CALIFORNIA_RENEWAL_PROGRESS_DESCRIPTION,
} from './constants';
import { ProfileSection } from './profile-section';
import type { CaliforniaRenewalProgressResult } from './calculate-california-renewal-progress';

export interface CaliforniaRenewalProgressProps extends CaliforniaRenewalProgressResult {
  className?: string;
}

const STAT_LABELS = {
  year1OnlineCeUnits: 'Year 1 Online CE Units Earned with CAL ACE Nursing Academy',
  year2OnlineCeUnits: 'Year 2 Online CE Units Earned with CAL ACE Nursing Academy',
  totalOnlineCeUnits: 'Total Online CE Units Earned with CAL ACE Nursing Academy',
  remainingOnlineCeUnitsAllowed: 'Remaining Online CE Units Allowed',
} as const;

export function CaliforniaRenewalProgress({
  year1OnlineCeUnits,
  year2OnlineCeUnits,
  totalOnlineCeUnits,
  remainingOnlineCeUnitsAllowed,
  className,
}: CaliforniaRenewalProgressProps) {
  const stats = [
    { key: 'year1OnlineCeUnits' as const, value: year1OnlineCeUnits },
    { key: 'year2OnlineCeUnits' as const, value: year2OnlineCeUnits },
    { key: 'totalOnlineCeUnits' as const, value: totalOnlineCeUnits },
    { key: 'remainingOnlineCeUnitsAllowed' as const, value: remainingOnlineCeUnitsAllowed },
  ];

  return (
    <ProfileSection
      className={className}
      description={CALIFORNIA_RENEWAL_PROGRESS_DESCRIPTION}
      headingId="california-renewal-progress-heading"
      title="California Renewal Progress"
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="rounded-md border border-border bg-muted/20 px-4 py-3"
          >
            <dt className="text-xs font-medium leading-snug text-muted-foreground">
              {STAT_LABELS[stat.key]}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">California CNA online CE guidance</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
            {CALIFORNIA_RENEWAL_GUIDANCE.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <p className="rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950">
          {CALIFORNIA_RENEWAL_ADDITIONAL_HOURS_NOTE}
        </p>
      </div>
    </ProfileSection>
  );
}
