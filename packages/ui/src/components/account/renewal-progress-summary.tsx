import { cn } from '../../lib/utils';

import { CALIFORNIA_RENEWAL_PROGRESS_DESCRIPTION } from './constants';
import { ProfileSection } from './profile-section';
import type { RenewalProgressSummaryProps } from './types';

export function RenewalProgressSummary({
  year1CeUnits,
  year2CeUnits,
  remainingCeUnitsNeeded,
  className,
}: RenewalProgressSummaryProps) {
  const items = [
    { label: 'Year 1 CE Units', value: year1CeUnits },
    { label: 'Year 2 CE Units', value: year2CeUnits },
    { label: 'Remaining CE Units needed', value: remainingCeUnitsNeeded },
  ] as const;

  return (
    <ProfileSection
      className={className}
      description={CALIFORNIA_RENEWAL_PROGRESS_DESCRIPTION}
      headingId="renewal-progress-heading"
      title="Renewal progress summary"
    >
      <dl className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-border bg-muted/20 px-4 py-3 text-center"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </ProfileSection>
  );
}
