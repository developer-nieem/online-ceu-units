import {
  bucketForDate,
  computeCertificationPeriods,
} from '@calace/compliance';

import { CAL_ACE_ONLINE_COURSE_CE_UNITS, CALIFORNIA_CNA_MAX_ONLINE_CE_UNITS } from './constants';

export interface CompletedCourseRecord {
  /** ISO date string (YYYY-MM-DD). */
  completedOn: string;
}

export interface CaliforniaRenewalProgressInput {
  cnaEffectiveDate: string;
  cnaExpirationDate?: string;
  completedCourses: ReadonlyArray<CompletedCourseRecord>;
}

export interface CaliforniaRenewalProgressResult {
  year1OnlineCeUnits: number;
  year2OnlineCeUnits: number;
  totalOnlineCeUnits: number;
  remainingOnlineCeUnitsAllowed: number;
}

function addYearsToIso(iso: string, years: number): string {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year + years, month - 1, day));
  return date.toISOString().slice(0, 10);
}

const EMPTY_RESULT: CaliforniaRenewalProgressResult = {
  year1OnlineCeUnits: 0,
  year2OnlineCeUnits: 0,
  totalOnlineCeUnits: 0,
  remainingOnlineCeUnitsAllowed: CALIFORNIA_CNA_MAX_ONLINE_CE_UNITS,
};

/**
 * Assigns each completed CAL ACE online course to Year 1 or Year 2 of the CNA
 * certification period using birthday-anchored boundaries (CALACE spec Section 3).
 *
 * Year 1: effective date through expiration minus one year.
 * Year 2: day after Year 1 ends through expiration date.
 */
export function calculateCaliforniaRenewalProgress(
  input: CaliforniaRenewalProgressInput,
): CaliforniaRenewalProgressResult {
  if (!input.cnaEffectiveDate) {
    return EMPTY_RESULT;
  }

  const expirationDate =
    input.cnaExpirationDate ?? addYearsToIso(input.cnaEffectiveDate, 2);

  const periodsResult = computeCertificationPeriods(
    input.cnaEffectiveDate,
    expirationDate,
  );
  if (!periodsResult.valid) {
    return EMPTY_RESULT;
  }

  const periods = periodsResult.periods;
  let year1OnlineCeUnits = 0;
  let year2OnlineCeUnits = 0;

  for (const course of input.completedCourses) {
    const units = CAL_ACE_ONLINE_COURSE_CE_UNITS;
    const bucket = bucketForDate(course.completedOn, periods);

    if (bucket === 'year1') {
      year1OnlineCeUnits += units;
    } else if (bucket === 'year2') {
      year2OnlineCeUnits += units;
    }
  }

  const totalOnlineCeUnits = year1OnlineCeUnits + year2OnlineCeUnits;
  const remainingOnlineCeUnitsAllowed = Math.max(
    0,
    CALIFORNIA_CNA_MAX_ONLINE_CE_UNITS - totalOnlineCeUnits,
  );

  return {
    year1OnlineCeUnits,
    year2OnlineCeUnits,
    totalOnlineCeUnits,
    remainingOnlineCeUnitsAllowed,
  };
}
