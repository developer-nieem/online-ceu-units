/**
 * Compliance engine tests — the LAW encoded as assertions.
 *
 * If any of these fail, the engine is wrong, and a real CNA's renewal math is wrong.
 * Each block ties back to CALACE_CNA_RENEWAL_COMPLIANCE_SPEC.
 */
import { describe, it, expect } from 'vitest';

import {
  computeCertificationPeriods,
  bucketForDate,
} from './periods';
import {
  evaluateRenewalCompliance,
  type HourEntry,
} from './evaluate';
import { CA_CNA_RULES, CA_HHA_RULES } from './rules';

describe('computeCertificationPeriods — birthday-anchored buckets', () => {
  it('CDPH 283A worked example: Effective 03/20/2024, Expires 05/15/2026', () => {
    const result = computeCertificationPeriods('2024-03-20', '2026-05-15');
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.periods.year1Start).toBe('2024-03-20');
    expect(result.periods.year1End).toBe('2025-05-15');
    expect(result.periods.year2Start).toBe('2025-05-16');
    expect(result.periods.year2End).toBe('2026-05-15');
    expect(result.periods.year1DayCount).toBeGreaterThan(365);
  });

  it('builds Year 1 / Year 2 from real dates anchored to expiration (standard ~2yr period)', () => {
    // Expiration on a birthday; effective ~2 years earlier.
    const result = computeCertificationPeriods('2024-05-15', '2026-05-15');
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.periods.year1Start).toBe('2024-05-15');
    expect(result.periods.year1End).toBe('2025-05-15'); // expiration minus 1 year
    expect(result.periods.year2Start).toBe('2025-05-16'); // day after
    expect(result.periods.year2End).toBe('2026-05-15'); // expiration
  });

  it('THE WRINKLE: a new cert whose Year 1 is LONGER than 12 months is preserved, not split into clean halves', () => {
    // Effective well before the (expiration - 1yr) boundary => Year 1 spans > 12 months.
    // Expiration 2026-09-01; boundary 2025-09-01; effective 2024-03-01 => Year 1 ~18 months.
    const result = computeCertificationPeriods('2024-03-01', '2026-09-01');
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.periods.year1Start).toBe('2024-03-01');
    expect(result.periods.year1End).toBe('2025-09-01');
    // Year 1 should be clearly longer than a year (~549 days), proving we don't force 12mo.
    expect(result.periods.year1DayCount).toBeGreaterThan(365);
    expect(result.periods.year2Start).toBe('2025-09-02');
    expect(result.periods.year2End).toBe('2026-09-01');
  });

  it('rejects effective date after the Year 1/Year 2 boundary (period too short)', () => {
    // Effective after (expiration - 1yr) => no valid 2-year structure.
    const result = computeCertificationPeriods('2025-12-01', '2026-05-15');
    expect(result.valid).toBe(false);
  });

  it('rejects effective on/after expiration', () => {
    expect(computeCertificationPeriods('2026-05-15', '2026-05-15').valid).toBe(false);
    expect(computeCertificationPeriods('2026-06-01', '2026-05-15').valid).toBe(false);
  });

  it('rejects malformed / impossible dates', () => {
    expect(computeCertificationPeriods('not-a-date', '2026-05-15').valid).toBe(false);
    expect(computeCertificationPeriods('2024-02-31', '2026-05-15').valid).toBe(false);
    expect(computeCertificationPeriods(null, '2026-05-15').valid).toBe(false);
    expect(computeCertificationPeriods('2024-05-15', null).valid).toBe(false);
  });
});

describe('bucketForDate', () => {
  const periods = {
    year1Start: '2024-05-15',
    year1End: '2025-05-15',
    year2Start: '2025-05-16',
    year2End: '2026-05-15',
    year1DayCount: 366,
    year2DayCount: 365,
  };

  it('assigns dates to the correct year, inclusive of boundaries', () => {
    expect(bucketForDate('2024-05-15', periods)).toBe('year1'); // year1 start edge
    expect(bucketForDate('2025-05-15', periods)).toBe('year1'); // year1 end edge
    expect(bucketForDate('2025-05-16', periods)).toBe('year2'); // year2 start edge
    expect(bucketForDate('2026-05-15', periods)).toBe('year2'); // year2 end edge
    expect(bucketForDate('2024-12-31', periods)).toBe('year1');
    expect(bucketForDate('2025-10-01', periods)).toBe('year2');
  });

  it('marks dates outside the period as outside', () => {
    expect(bucketForDate('2024-05-14', periods)).toBe('outside'); // before
    expect(bucketForDate('2026-05-16', periods)).toBe('outside'); // after
    expect(bucketForDate('bad', periods)).toBe('outside');
  });
});

describe('evaluateRenewalCompliance — CNA, all three rules independently', () => {
  // Reference oracle: the CDPH worked example seeded in the CE Planner.
  //   2024-06-01  12h online    (Y1)
  //   2024-09-15   8h in-person (Y1)  => Y1 = 20
  //   2025-08-01  12h online    (Y2)  => online total 24 (exactly at cap)
  //   2025-10-01   4h in-person (Y2)  => Y2 = 16
  // Period: effective 2024-03-20, expiration 2026-05-15 (boundary 2025-05-15).
  const cdphExample: HourEntry[] = [
    { completedOn: '2024-06-01', hours: 12, modality: 'online' },
    { completedOn: '2024-09-15', hours: 8, modality: 'in_person' },
    { completedOn: '2025-08-01', hours: 12, modality: 'online' },
    { completedOn: '2025-10-01', hours: 4, modality: 'in_person' },
  ];

  it('CDPH worked example: Y1=20, Y2=16, online=24 (at cap), total credited=36', () => {
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries: cdphExample,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.breakdown.year1Hours).toBe(20);
    expect(v.breakdown.year2Hours).toBe(16);
    expect(v.breakdown.onlineHours).toBe(24);
    expect(v.breakdown.onlineHoursCredited).toBe(24);
    expect(v.breakdown.onlineHoursExcess).toBe(0);
    expect(v.breakdown.inPersonHours).toBe(12);
    expect(v.breakdown.creditedTotalHours).toBe(36);
    // Both yearly minimums met, online within cap, but total 36 < 48 => not compliant yet.
    expect(v.rules.year1.pass).toBe(true);
    expect(v.rules.year2.pass).toBe(true);
    expect(v.rules.online.pass).toBe(true);
    expect(v.rules.total.pass).toBe(false);
    expect(v.compliant).toBe(false);
    // Needs 12 more, and all 12 must be in-person (24 in-person required, only 12 done).
    expect(v.breakdown.remainingHours).toBe(12);
    expect(v.breakdown.remainingMustBeInPerson).toBe(12);
  });

  it('fully compliant: 24 online + 24 in-person, 12+ each year', () => {
    const entries: HourEntry[] = [
      { completedOn: '2024-06-01', hours: 12, modality: 'online' },
      { completedOn: '2024-07-01', hours: 12, modality: 'in_person' },
      { completedOn: '2025-08-01', hours: 12, modality: 'online' },
      { completedOn: '2025-09-01', hours: 12, modality: 'in_person' },
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.compliant).toBe(true);
    expect(v.rules.total.pass).toBe(true);
    expect(v.rules.year1.pass).toBe(true);
    expect(v.rules.year2.pass).toBe(true);
    expect(v.rules.online.pass).toBe(true);
    expect(v.breakdown.creditedTotalHours).toBe(48);
  });

  it('THE TRAP #1: 48 total hours but Year 1 short => NON-compliant', () => {
    // 8 in Year 1, 40 in Year 2. Total 48, but Year 1 < 12.
    const entries: HourEntry[] = [
      { completedOn: '2024-06-01', hours: 8, modality: 'in_person' }, // Y1 = 8
      { completedOn: '2025-08-01', hours: 24, modality: 'in_person' }, // Y2
      { completedOn: '2025-09-01', hours: 16, modality: 'in_person' }, // Y2 => Y2 = 40
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.breakdown.creditedTotalHours).toBe(48); // total IS met
    expect(v.rules.total.pass).toBe(true);
    expect(v.rules.year1.pass).toBe(false); // but Year 1 fails
    expect(v.compliant).toBe(false); // => NOT compliant
  });

  it('THE TRAP #2: 48 total but 30 online => only 24 credited, NON-compliant + excess flagged', () => {
    // 30 online + 18 in-person. Online beyond 24 does not count => credited 24+18 = 42.
    const entries: HourEntry[] = [
      { completedOn: '2024-06-01', hours: 15, modality: 'online' }, // Y1
      { completedOn: '2024-09-01', hours: 9, modality: 'in_person' }, // Y1 => Y1 = 24
      { completedOn: '2025-08-01', hours: 15, modality: 'online' }, // Y2 (online total 30)
      { completedOn: '2025-10-01', hours: 9, modality: 'in_person' }, // Y2 => Y2 = 24
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.breakdown.onlineHours).toBe(30);
    expect(v.breakdown.onlineHoursCredited).toBe(24); // capped
    expect(v.breakdown.onlineHoursExcess).toBe(6);
    expect(v.breakdown.creditedTotalHours).toBe(42); // 24 + 18, NOT 48
    expect(v.rules.online.pass).toBe(false); // over cap
    expect(v.rules.total.pass).toBe(false); // credited < 48
    expect(v.compliant).toBe(false);
    expect(v.breakdown.year1Hours).toBe(24);
    expect(v.breakdown.year2Hours).toBe(24);
  });

  it('counts only hours inside the period; outside-period hours are excluded', () => {
    const entries: HourEntry[] = [
      { completedOn: '2024-01-01', hours: 10, modality: 'in_person' }, // before effective
      { completedOn: '2026-12-01', hours: 10, modality: 'in_person' }, // after expiration
      { completedOn: '2024-06-01', hours: 12, modality: 'in_person' }, // Y1, counts
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.breakdown.outsidePeriodHours).toBe(20);
    expect(v.breakdown.creditedTotalHours).toBe(12);
  });

  it('returns invalid when dates are bad (engine refuses to guess)', () => {
    const v = evaluateRenewalCompliance({
      effectiveDate: null,
      expirationDate: '2026-05-15',
      entries: [],
    });
    expect(v.valid).toBe(false);
  });

  it('handles fractional hours without float drift', () => {
    const entries: HourEntry[] = [
      { completedOn: '2024-06-01', hours: 0.5, modality: 'online' },
      { completedOn: '2024-06-02', hours: 0.25, modality: 'online' },
      { completedOn: '2024-06-03', hours: 0.1, modality: 'in_person' },
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.breakdown.year1Hours).toBe(0.85);
  });
});

describe('evaluateRenewalCompliance — HHA: zero online allowed', () => {
  it('rejects all online hours for HHA (cap 0); only in-person counts', () => {
    const entries: HourEntry[] = [
      { completedOn: '2024-06-01', hours: 12, modality: 'online' }, // does not count
      { completedOn: '2024-07-01', hours: 12, modality: 'in_person' }, // Y1
      { completedOn: '2025-08-01', hours: 12, modality: 'in_person' }, // Y2
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
      rules: CA_HHA_RULES,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.breakdown.onlineHours).toBe(12);
    expect(v.breakdown.onlineHoursCredited).toBe(0); // cap 0
    expect(v.breakdown.onlineHoursExcess).toBe(12);
    expect(v.breakdown.creditedTotalHours).toBe(24); // only the 24 in-person
    expect(v.rules.total.pass).toBe(true); // HHA total is 24
    expect(v.rules.online.pass).toBe(false); // any online breaks the 0 cap
    expect(v.compliant).toBe(false);
  });

  it('HHA fully compliant with 24 in-person split across both years', () => {
    const entries: HourEntry[] = [
      { completedOn: '2024-07-01', hours: 12, modality: 'in_person' },
      { completedOn: '2025-08-01', hours: 12, modality: 'in_person' },
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
      rules: CA_HHA_RULES,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.compliant).toBe(true);
  });
});

describe('rule sets are settings, not hard-coded', () => {
  it('exposes CA CNA defaults of 48 / 12 / 24', () => {
    expect(CA_CNA_RULES.totalRequiredHours).toBe(48);
    expect(CA_CNA_RULES.minimumHoursPerYear).toBe(12);
    expect(CA_CNA_RULES.maximumOnlineHours).toBe(24);
  });

  it('accepts a custom rule set (future state/profession) without code change', () => {
    const customRules = {
      totalRequiredHours: 30,
      minimumHoursPerYear: 10,
      maximumOnlineHours: 30,
      label: 'TEST-STATE',
    };
    const entries: HourEntry[] = [
      { completedOn: '2024-06-01', hours: 15, modality: 'online' },
      { completedOn: '2025-08-01', hours: 15, modality: 'online' },
    ];
    const v = evaluateRenewalCompliance({
      effectiveDate: '2024-03-20',
      expirationDate: '2026-05-15',
      entries,
      rules: customRules,
    });
    expect(v.valid).toBe(true);
    if (!v.valid) return;
    expect(v.compliant).toBe(true); // 30 total, 15 each year, all online allowed
    expect(v.rules.total.required).toBe(30);
  });
});
