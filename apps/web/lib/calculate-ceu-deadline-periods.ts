import {
  CALIFORNIA_CNA_MAX_ONLINE_CE_UNITS,
  CALIFORNIA_CNA_MIN_CE_PER_YEAR,
  CALIFORNIA_CNA_TOTAL_CE_REQUIRED,
} from '@calace/ui/components/account';

export const CEU_DEADLINE_REQUIREMENTS = {
  totalRequiredHours: CALIFORNIA_CNA_TOTAL_CE_REQUIRED,
  minimumHoursPerYear: CALIFORNIA_CNA_MIN_CE_PER_YEAR,
  maximumOnlineHours: CALIFORNIA_CNA_MAX_ONLINE_CE_UNITS,
  minimumInPersonHours: CALIFORNIA_CNA_TOTAL_CE_REQUIRED - CALIFORNIA_CNA_MAX_ONLINE_CE_UNITS,
} as const;

export type CeuDeadlinePeriods = {
  year1Start: string;
  year1End: string;
  year2Start: string;
  year2End: string;
  year1DayCount: number;
  year2DayCount: number;
  totalDayCount: number;
  year1SharePct: number;
  year2SharePct: number;
};

export type CeuDeadlineCalculation =
  | { valid: true; periods: CeuDeadlinePeriods }
  | { valid: false; error: string };

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Month arithmetic equivalent to Excel EDATE: subtract calendar months while
 * preserving day-of-month, clamping to the last day of the target month when needed.
 */
function subtractMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setMonth(result.getMonth() - months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

/**
 * CDPH Online-Certification-Tool leap-year boundary rule (CNA/HHA sheets).
 * Applied to the RESULT of EDATE(exp, -24) and EDATE(exp, -12):
 *   - Feb 29 → keep unchanged
 *   - Feb 28 → use March 1 of that same year
 *   - otherwise → unchanged
 * Do not "simplify" this — it is intentional workbook parity, not general leap logic.
 */
function applyCdphLeapBoundary(date: Date): Date {
  const month = date.getMonth(); // 0-based: February = 1
  const day = date.getDate();
  if (month === 1 && day === 29) {
    return date;
  }
  if (month === 1 && day === 28) {
    return new Date(date.getFullYear(), 2, 1); // March 1
  }
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daySpanInclusive(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
}

/**
 * CDPH Online-Certification-Tool display windows (expiration only):
 * - Year 1: EDATE(exp, -24) → EDATE(exp, -12), each then leap-adjusted
 * - Year 2: (adjusted Year 1 end + 1 day) → expiration (never leap-adjusted)
 *
 * `effectiveDate` is accepted for call-site compatibility but does NOT affect the windows.
 */
export function calculateCeuDeadlinePeriods(
  effectiveDate: string | null | undefined,
  expirationDate: string,
): CeuDeadlineCalculation {
  void effectiveDate;

  const expiration = parseIsoDate(expirationDate);
  if (!expiration) {
    return { valid: false, error: 'Enter a valid certification expiration date.' };
  }

  const year1Start = applyCdphLeapBoundary(subtractMonths(expiration, 24));
  const year1End = applyCdphLeapBoundary(subtractMonths(expiration, 12));
  // year2Start must use the adjusted year1End (workbook: Year1 end + 1 day).
  const year2Start = addDays(year1End, 1);
  const year2End = expiration;

  if (year2Start > year2End) {
    return {
      valid: false,
      error: 'These dates do not form a valid two-year certification period.',
    };
  }

  const year1DayCount = daySpanInclusive(year1Start, year1End);
  const year2DayCount = daySpanInclusive(year2Start, year2End);
  const totalDayCount = year1DayCount + year2DayCount;

  return {
    valid: true,
    periods: {
      year1Start: formatIsoDate(year1Start),
      year1End: formatIsoDate(year1End),
      year2Start: formatIsoDate(year2Start),
      year2End: formatIsoDate(year2End),
      year1DayCount,
      year2DayCount,
      totalDayCount,
      year1SharePct: Math.round((year1DayCount / totalDayCount) * 100),
      year2SharePct: Math.round((year2DayCount / totalDayCount) * 100),
    },
  };
}
