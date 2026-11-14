'use client';

import { Progress } from '@calace/ui/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { AlertTriangle, CalendarRange, Clock, Monitor, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  CEU_DEADLINE_REQUIREMENTS,
  calculateCeuDeadlinePeriods,
} from '@/lib/calculate-ceu-deadline-periods';
import { CALIFORNIA_EARLY_RENEWAL_NOTE } from '@calace/ui/components/account';

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type CeuDeadlineCalculatorProps = {
  initialEffectiveDate?: string | null;
  initialExpirationDate?: string | null;
};

export function CeuDeadlineCalculator({
  initialEffectiveDate = '',
  initialExpirationDate = '',
}: CeuDeadlineCalculatorProps) {
  const [effectiveDate, setEffectiveDate] = useState(initialEffectiveDate ?? '');
  const [expirationDate, setExpirationDate] = useState(initialExpirationDate ?? '');

  const calculation = useMemo(
    () => calculateCeuDeadlinePeriods(effectiveDate, expirationDate),
    [effectiveDate, expirationDate],
  );

  const { totalRequiredHours, minimumHoursPerYear, maximumOnlineHours, minimumInPersonHours } =
    CEU_DEADLINE_REQUIREMENTS;

  const yearMinimumPct = Math.round((minimumHoursPerYear / totalRequiredHours) * 100);
  const onlineLimitPct = Math.round((maximumOnlineHours / totalRequiredHours) * 100);

  return (
    <Card className="overflow-hidden border-teal-100 shadow-sm">
      <CardHeader className="border-b border-teal-50 bg-gradient-to-br from-teal-50/80 via-white to-slate-50/50">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-teal-100 p-2 text-teal-800">
            <CalendarRange className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-900">CNA CEU Deadline Calculator</CardTitle>
            <CardDescription className="mt-1 max-w-prose">
              California CNA renewal periods are derived from your certification expiration date
              (your birthday) — the same approach as the CDPH Online Certification Tool. Enter that
              date to see your Year 1 and Year 2 windows.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm sm:col-start-1">
            <span className="font-medium text-slate-800">Expiration date</span>
            <span className="block text-xs text-muted-foreground">
              Your certification expiration — always your birthday. This is all you need.
            </span>
            <input
              className={inputClass}
              type="date"
              value={expirationDate}
              onChange={(event) => setExpirationDate(event.target.value)}
              aria-describedby="ceu-expiration-date-hint"
            />
            <span id="ceu-expiration-date-hint" className="sr-only">
              Required. Used to calculate Year 1 and Year 2 certification periods.
            </span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-slate-800">
              Effective / issue date{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </span>
            <span className="block text-xs text-muted-foreground">
              For your reference only — does not change the Year 1 / Year 2 windows below
            </span>
            <input
              className={inputClass}
              type="date"
              value={effectiveDate}
              onChange={(event) => setEffectiveDate(event.target.value)}
            />
          </label>
        </div>

        {!expirationDate ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-muted-foreground">
            Enter your certification expiration date above to calculate your certification periods
            and CEU requirements.
          </p>
        ) : null}

        {expirationDate && !calculation.valid ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {calculation.error}
          </p>
        ) : null}

        {calculation.valid ? (
          <div className="space-y-6">
            <section aria-labelledby="ceu-period-timeline-heading">
              <h3
                id="ceu-period-timeline-heading"
                className="text-sm font-semibold uppercase tracking-wide text-slate-700"
              >
                Your certification timeline
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {calculation.periods.totalDayCount} days total across two reporting years
              </p>

              <div className="mt-4 flex h-14 overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                <div
                  className="flex min-w-0 flex-col justify-center bg-gradient-to-r from-teal-600 to-teal-500 px-3 text-white transition-all duration-300"
                  style={{ width: `${calculation.periods.year1SharePct}%` }}
                  title={`Year 1: ${formatDisplayDate(calculation.periods.year1Start)} – ${formatDisplayDate(calculation.periods.year1End)}`}
                >
                  <span className="truncate text-xs font-semibold uppercase tracking-wide">
                    Year 1
                  </span>
                  <span className="truncate text-[11px] opacity-90">
                    {calculation.periods.year1DayCount} days
                  </span>
                </div>
                <div
                  className="flex min-w-0 flex-col justify-center bg-gradient-to-r from-slate-700 to-slate-600 px-3 text-white transition-all duration-300"
                  style={{ width: `${calculation.periods.year2SharePct}%` }}
                  title={`Year 2: ${formatDisplayDate(calculation.periods.year2Start)} – ${formatDisplayDate(calculation.periods.year2End)}`}
                >
                  <span className="truncate text-xs font-semibold uppercase tracking-wide">
                    Year 2
                  </span>
                  <span className="truncate text-[11px] opacity-90">
                    {calculation.periods.year2DayCount} days
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PeriodBlock
                  label="Year 1 period"
                  accent="teal"
                  start={calculation.periods.year1Start}
                  end={calculation.periods.year1End}
                  minimumHours={minimumHoursPerYear}
                  minimumPct={yearMinimumPct}
                />
                <PeriodBlock
                  label="Year 2 period"
                  accent="slate"
                  start={calculation.periods.year2Start}
                  end={calculation.periods.year2End}
                  minimumHours={minimumHoursPerYear}
                  minimumPct={yearMinimumPct}
                />
              </div>

              <p
                className="mt-4 rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
                role="note"
              >
                If your certificate was issued before the start of Year 1, any CE hours completed
                during that time may still be counted toward your Year 1 total.
              </p>

              <p
                className="mt-3 rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950"
                role="note"
              >
                {CALIFORNIA_EARLY_RENEWAL_NOTE}
              </p>
            </section>

            <section
              aria-labelledby="ceu-total-requirements-heading"
              className="rounded-xl border bg-slate-50/60 p-4"
            >
              <h3
                id="ceu-total-requirements-heading"
                className="flex items-center gap-2 text-sm font-semibold text-slate-900"
              >
                <Clock className="h-4 w-4 text-teal-700" aria-hidden />
                Total renewal requirements
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                You need a total of{' '}
                <span className="font-semibold text-teal-800">{totalRequiredHours} hours</span> to
                renew, with at least{' '}
                <span className="font-semibold">{minimumHoursPerYear} hours in Year 1</span> and at
                least <span className="font-semibold">{minimumHoursPerYear} hours in Year 2</span>.
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>48-hour renewal total</span>
                  <span>{totalRequiredHours} hrs required</span>
                </div>
                <Progress value={100} className="h-3 bg-teal-100" aria-hidden />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Year 1 min ({minimumHoursPerYear} hrs)</span>
                  <span>Year 2 min ({minimumHoursPerYear} hrs)</span>
                </div>
              </div>
            </section>

            <section
              aria-labelledby="ceu-online-limit-heading"
              className="rounded-xl border border-amber-200 bg-amber-50/70 p-4"
            >
              <h3
                id="ceu-online-limit-heading"
                className="flex items-center gap-2 text-sm font-semibold text-amber-950"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                Online CE limit — plan your hours carefully
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
                CDPH allows a <span className="font-semibold">maximum of {maximumOnlineHours} hours</span>{' '}
                online during your two-year period. That means at least{' '}
                <span className="font-semibold">{minimumInPersonHours} hours</span> must come from
                in-person or employer in-service training — CAL ACE online courses count toward the
                online cap only.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex h-10 overflow-hidden rounded-lg border border-amber-200/80">
                  <div
                    className="flex items-center justify-center gap-1.5 bg-teal-600 text-xs font-medium text-white"
                    style={{ width: `${onlineLimitPct}%` }}
                  >
                    <Monitor className="h-3.5 w-3.5" aria-hidden />
                    <span>Online max {maximumOnlineHours}h</span>
                  </div>
                  <div
                    className="flex items-center justify-center gap-1.5 bg-slate-600 text-xs font-medium text-white"
                    style={{ width: `${100 - onlineLimitPct}%` }}
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    <span>In-person min {minimumInPersonHours}h</span>
                  </div>
                </div>
                <Progress
                  value={onlineLimitPct}
                  className="h-2 bg-amber-100"
                  aria-label={`${maximumOnlineHours} of ${totalRequiredHours} hours may be completed online`}
                />
                <p className="text-xs text-amber-900/80">
                  On CAL ACE you can earn up to {maximumOnlineHours} online hours toward renewal.
                  Track your remaining online allowance in the renewal progress section below.
                </p>
              </div>
            </section>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">
          This calculator is an educational planning tool. CDPH makes final determinations on
          certification periods, delinquency, and renewal eligibility. Confirm dates on your CNA
          certificate or with CDPH before submitting renewal paperwork.
        </p>
      </CardContent>
    </Card>
  );
}

function PeriodBlock({
  label,
  accent,
  start,
  end,
  minimumHours,
  minimumPct,
}: {
  label: string;
  accent: 'teal' | 'slate';
  start: string;
  end: string;
  minimumHours: number;
  minimumPct: number;
}) {
  const accentClasses =
    accent === 'teal'
      ? 'border-teal-200 bg-teal-50/50 text-teal-900'
      : 'border-slate-200 bg-slate-50/80 text-slate-900';

  const barClass = accent === 'teal' ? 'bg-teal-100' : 'bg-slate-200';

  return (
    <div className={`rounded-lg border p-4 ${accentClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-sm font-medium">
        {formatDisplayDate(start)}
        <span className="mx-1.5 font-normal text-muted-foreground">→</span>
        {formatDisplayDate(end)}
      </p>
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Minimum CE required</span>
          <span>{minimumHours} hrs</span>
        </div>
        <Progress
          value={minimumPct}
          className={`h-2 ${barClass}`}
          aria-label={`${minimumHours} hour minimum for ${label}`}
        />
      </div>
    </div>
  );
}
