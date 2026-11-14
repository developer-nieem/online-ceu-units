import { TranscriptEntryType } from '@calace/db';
import {
  computeCertificationPeriods,
  bucketForDate,
  CA_CNA_RULES,
  type CertificationPeriods,
} from '@calace/compliance';

/** California CNA renewal guidance assumptions (educational; not CDPH approval). */
export const CA_RENEWAL_GUIDANCE = {
  renewalPeriodYears: 2,
  totalRequiredHours: 48,
  minimumHoursPerYear: 12,
  maximumOnlineHours: 24,
} as const;

export type CaliforniaRenewalProgress = {
  year1OnlineCeHours: number;
  year2OnlineCeHours: number;
  totalOnlineCeHours: number;
  remainingOnlineCeHoursAllowed: number;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  renewalDueDate: string | null;
  periodEstimated: boolean;
  minimumHoursPerYear: number;
  maximumOnlineHours: number;
  totalRequiredHours: number;
  trackingScope: string;
};

type EntryRow = {
  completedOn: Date;
  ceHours: unknown;
  deliveryMode?: string | null;
};

export function computeCaliforniaRenewalProgress(params: {
  entries: EntryRow[];
  effectiveDate: Date | null;
  renewalDueDate: Date | null;
  memberSince: Date;
}): CaliforniaRenewalProgress {
  const { entries, effectiveDate, renewalDueDate, memberSince } = params;
  const now = new Date();

  const effectiveStr = effectiveDate ? formatDateOnly(effectiveDate) : null;
  const expirationStr = renewalDueDate ? formatDateOnly(renewalDueDate) : null;

  let periods: CertificationPeriods;
  let periodStartStr: string;
  let periodEndStr: string;
  let periodEstimated: boolean;
  let periodLabel: string;

  const periodsResult =
    effectiveStr && expirationStr
      ? computeCertificationPeriods(effectiveStr, expirationStr)
      : null;

  if (periodsResult?.valid) {
    periods = periodsResult.periods;
    periodStartStr = periods.year1Start;
    periodEndStr = periods.year2End;
    periodEstimated = false;
    periodLabel =
      '24-month window aligned to your CNA certification (effective → expiration)';
  } else {
    let periodEnd = renewalDueDate ? startOfUtcDay(renewalDueDate) : startOfUtcDay(now);
    let periodStart = addUtcMonths(periodEnd, -CA_RENEWAL_GUIDANCE.renewalPeriodYears * 12);
    periodEstimated = !renewalDueDate;

    const memberStart = startOfUtcDay(memberSince);
    if (periodStart < memberStart) {
      periodStart = memberStart;
    }

    const year1ExclusiveEnd = addUtcMonths(periodStart, 12);
    periods = {
      year1Start: formatDateOnly(periodStart),
      year1End: formatDateOnly(addUtcDays(year1ExclusiveEnd, -1)),
      year2Start: formatDateOnly(year1ExclusiveEnd),
      year2End: formatDateOnly(periodEnd),
      year1DayCount: 0,
      year2DayCount: 0,
    };
    periodStartStr = periods.year1Start;
    periodEndStr = periods.year2End;

    periodLabel = periodEstimated
      ? 'Estimated 24-month window (add your CNA renewal due date for a period aligned to certification)'
      : '24-month window ending on your CNA renewal due date';
  }

  let year1OnlineCeHours = 0;
  let year2OnlineCeHours = 0;

  for (const entry of entries) {
    if (!isOnlineDelivery(entry.deliveryMode)) {
      continue;
    }

    const hours = roundHours(entry.ceHours);
    const completedStr = formatDateOnly(startOfUtcDay(entry.completedOn));
    const bucket = bucketForDate(completedStr, periods);
    if (bucket === 'year1') {
      year1OnlineCeHours += hours;
    } else if (bucket === 'year2') {
      year2OnlineCeHours += hours;
    }
  }

  year1OnlineCeHours = roundHours(year1OnlineCeHours);
  year2OnlineCeHours = roundHours(year2OnlineCeHours);
  const totalOnlineCeHours = roundHours(year1OnlineCeHours + year2OnlineCeHours);
  const remainingOnlineCeHoursAllowed = Math.max(
    0,
    roundHours(CA_CNA_RULES.maximumOnlineHours - totalOnlineCeHours),
  );

  return {
    year1OnlineCeHours,
    year2OnlineCeHours,
    totalOnlineCeHours,
    remainingOnlineCeHoursAllowed,
    periodStart: periodStartStr,
    periodEnd: periodEndStr,
    periodLabel,
    renewalDueDate: renewalDueDate ? formatDateOnly(renewalDueDate) : null,
    periodEstimated,
    minimumHoursPerYear: CA_CNA_RULES.minimumHoursPerYear,
    maximumOnlineHours: CA_CNA_RULES.maximumOnlineHours,
    totalRequiredHours: CA_CNA_RULES.totalRequiredHours,
    trackingScope:
      'Online CE hours completed and recorded in this CAL ACE learner platform only.',
  };
}

export const TRANSCRIPT_COMPLETION_FILTER = {
  entryType: TranscriptEntryType.COMPLETION,
} as const;

function isOnlineDelivery(deliveryMode: string | null | undefined): boolean {
  // All current CAL ACE courses are online CE; null/undefined defaults to online.
  if (deliveryMode == null) {
    return true;
  }
  return deliveryMode === 'ONLINE';
}

function roundHours(value: unknown): number {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
