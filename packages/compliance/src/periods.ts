/**
 * CNA renewal certification-period math — the birthday-anchored Year 1 / Year 2 buckets.
 *
 * GROUND TRUTH (from CALACE_CNA_RENEWAL_COMPLIANCE_SPEC, Section 3):
 *   - The certification period runs birthday to birthday, NOT calendar.
 *   - The certificate EXPIRES on the person's birthday — the reliable anchor.
 *   - Year 1 = effective date  ->  (expiration minus one year)
 *   - Year 2 = (day after Year 1 ends)  ->  expiration date
 *   - WRINKLE: for a new certificate, time from the effective date up to the first
 *     birthday folds into Year 1 — so Year 1 can be LONGER than 12 months. We define
 *     the buckets from the REAL dates, never as two clean 12-month halves.
 *
 * This module computes only the period boundaries. Rule evaluation (48 / 12-per-year /
 * 24-online) lives in evaluate.ts and consumes these boundaries.
 *
 * All dates are handled as calendar dates (no time-of-day, no timezone drift) via a
 * UTC-midnight normalization, matching the existing calculate-ceu-deadline-periods logic.
 */

/** A calendar date with no time component, represented as ISO 'YYYY-MM-DD'. */
export type IsoDate = string;

export type CertificationPeriods = {
  /** Year 1 start = certificate effective date (period start). */
  year1Start: IsoDate;
  /** Year 1 end = expiration minus one year (the birthday boundary). */
  year1End: IsoDate;
  /** Year 2 start = day after Year 1 ends. */
  year2Start: IsoDate;
  /** Year 2 end = expiration date (the birthday the cert expires on). */
  year2End: IsoDate;
  /** Inclusive day count of Year 1 (can exceed 365 for a new cert — the wrinkle). */
  year1DayCount: number;
  /** Inclusive day count of Year 2. */
  year2DayCount: number;
};

export type PeriodsResult =
  | { valid: true; periods: CertificationPeriods }
  | { valid: false; error: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse 'YYYY-MM-DD' to a UTC-midnight Date. Returns null on malformed/invalid input. */
export function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject impossible dates that JS would roll over (e.g. 2024-02-31).
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

function subtractYearsUtc(date: Date, years: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear() - years, date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** Inclusive day span between two UTC-midnight dates (start and end both counted). */
function daySpanInclusive(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/**
 * Compute the birthday-anchored Year 1 / Year 2 buckets from the certificate's
 * effective and expiration dates.
 *
 * Anchors to EXPIRATION (the reliable birthday). Year 1 runs from the effective date
 * to one year before expiration; Year 2 runs the final year to expiration. Year 1 may
 * be longer than 12 months for a new certificate — this is expected and preserved.
 */
export function computeCertificationPeriods(
  effectiveDate: string | null | undefined,
  expirationDate: string | null | undefined,
): PeriodsResult {
  const effective = parseIsoDate(effectiveDate);
  const expiration = parseIsoDate(expirationDate);

  if (!effective) {
    return { valid: false, error: 'Enter a valid certificate effective date (YYYY-MM-DD).' };
  }
  if (!expiration) {
    return { valid: false, error: 'Enter a valid certificate expiration date (YYYY-MM-DD).' };
  }
  if (effective.getTime() >= expiration.getTime()) {
    return {
      valid: false,
      error: 'Expiration date must be after the certificate effective date.',
    };
  }

  const year1End = subtractYearsUtc(expiration, 1);

  // The effective date must fall on or before the Year 1/Year 2 boundary, otherwise
  // there is no valid two-year structure (e.g. a period shorter than ~1 year).
  if (effective.getTime() > year1End.getTime()) {
    return {
      valid: false,
      error: `Effective date must be on or before ${formatIsoDate(year1End)} for this expiration date.`,
    };
  }

  const year1Start = effective;
  const year2Start = addDaysUtc(year1End, 1);
  const year2End = expiration;

  return {
    valid: true,
    periods: {
      year1Start: formatIsoDate(year1Start),
      year1End: formatIsoDate(year1End),
      year2Start: formatIsoDate(year2Start),
      year2End: formatIsoDate(year2End),
      year1DayCount: daySpanInclusive(year1Start, year1End),
      year2DayCount: daySpanInclusive(year2Start, year2End),
    },
  };
}

/**
 * Assign a completion date to a period bucket.
 * Returns 'year1', 'year2', or 'outside' (does not count toward this renewal).
 */
export function bucketForDate(
  completedOn: string | null | undefined,
  periods: CertificationPeriods,
): 'year1' | 'year2' | 'outside' {
  const completed = parseIsoDate(completedOn);
  if (!completed) return 'outside';

  const y1Start = parseIsoDate(periods.year1Start)!;
  const y1End = parseIsoDate(periods.year1End)!;
  const y2Start = parseIsoDate(periods.year2Start)!;
  const y2End = parseIsoDate(periods.year2End)!;

  const t = completed.getTime();
  if (t >= y1Start.getTime() && t <= y1End.getTime()) return 'year1';
  if (t >= y2Start.getTime() && t <= y2End.getTime()) return 'year2';
  return 'outside';
}
