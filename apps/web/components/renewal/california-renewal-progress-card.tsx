import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';

import type { CaliforniaRenewalProgress } from '@/lib/account';

function formatHours(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatPeriodDate(iso: string) {
  try {
    const parts = iso.split('-').map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (y === undefined || m === undefined || d === undefined) return iso;
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function CaliforniaRenewalProgressCard({
  progress,
}: {
  progress: CaliforniaRenewalProgress;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">California CNA renewal progress</CardTitle>
        <CardDescription>
          Online CE hours completed with CAL ACE in this platform only — not in-person, employer
          in-service, or outside providers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric
            label="Year 1 online CE (CAL ACE)"
            value={`${formatHours(progress.year1OnlineCeHours)} hrs`}
            hint={`Minimum ${progress.minimumHoursPerYear} hrs/year required for renewal (all sources)`}
          />
          <Metric
            label="Year 2 online CE (CAL ACE)"
            value={`${formatHours(progress.year2OnlineCeHours)} hrs`}
            hint={`Minimum ${progress.minimumHoursPerYear} hrs/year required for renewal (all sources)`}
          />
          <Metric
            label="Total online CE (CAL ACE)"
            value={`${formatHours(progress.totalOnlineCeHours)} hrs`}
            hint={`California allows up to ${progress.maximumOnlineHours} online hours toward CNA renewal`}
          />
          <Metric
            label="Remaining online CE allowed (CAL ACE)"
            value={`${formatHours(progress.remainingOnlineCeHoursAllowed)} hrs`}
            hint="Based on online hours completed in this LMS only"
          />
        </div>

        <div className="rounded-lg border bg-slate-50/80 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Tracking period</p>
          <p className="mt-1">
            {formatPeriodDate(progress.periodStart)} – {formatPeriodDate(progress.periodEnd)}
          </p>
          <p className="mt-2 text-muted-foreground">{progress.periodLabel}</p>
          {progress.renewalDueDate ? (
            <p className="mt-2">
              <span className="font-medium text-slate-800">CNA renewal due date on file: </span>
              {formatPeriodDate(progress.renewalDueDate)}
            </p>
          ) : (
            <p className="mt-2 text-amber-900">
              Add your CNA renewal due date below to align this summary with your certification
              period.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{progress.trackingScope}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          California CNA renewal generally requires {progress.totalRequiredHours} total CE/In-Service
          hours over a two-year certification period, with at least {progress.minimumHoursPerYear}{' '}
          hours in each year. CAL ACE does not track hours completed outside this platform.
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-teal-800">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
