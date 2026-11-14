/**
 * The renewal compliance engine — pure function, no DB / auth / network.
 *
 *   evaluateRenewalCompliance({ effectiveDate, expirationDate, entries, rules })
 *     -> a verdict that checks ALL THREE rules INDEPENDENTLY.
 *
 * The classic failure this engine exists to prevent (spec Section 2): counting only the
 * 48-hour total. A learner can have 48 hours and still be NON-COMPLIANT if Year 1 is
 * short, or if more than 24 hours are online. Each rule is evaluated separately and
 * reported separately.
 *
 * Online cap behavior: online hours beyond the cap do NOT count toward the total. Only
 * `min(online, cap)` of the online hours are credited. In-person hours are never capped.
 */
import {
  bucketForDate,
  computeCertificationPeriods,
  type CertificationPeriods,
} from './periods';
import { CA_CNA_RULES, type RenewalRuleSet } from './rules';

export type Modality = 'online' | 'in_person';

/** One logged CE/in-service hour entry. */
export type HourEntry = {
  /** Completion date 'YYYY-MM-DD'. Entries outside the period are ignored. */
  completedOn: string;
  /** Hours earned (may be fractional, e.g. 1.0, 0.5). */
  hours: number;
  /** Delivery modality — drives the online cap. */
  modality: Modality;
};

export type RuleCheck = {
  /** Hours counted toward this rule. */
  value: number;
  /** Threshold the rule requires. */
  required: number;
  /** Whether the rule is satisfied. */
  pass: boolean;
};

export type RenewalVerdict = {
  valid: true;
  /** Overall: true only if every rule passes. */
  compliant: boolean;
  periods: CertificationPeriods;
  rules: {
    /** Rule 1 — total hours credited vs. required (online beyond cap excluded). */
    total: RuleCheck;
    /** Rule 2a — Year 1 hours vs. per-year minimum. */
    year1: RuleCheck;
    /** Rule 2b — Year 2 hours vs. per-year minimum. */
    year2: RuleCheck;
    /** Rule 3 — online hours used vs. online cap (pass = within cap). */
    online: RuleCheck;
  };
  breakdown: {
    /** Raw hours by bucket (before online cap). */
    year1Hours: number;
    year2Hours: number;
    /** Total online hours logged within the period (before cap). */
    onlineHours: number;
    /** Total in-person hours logged within the period. */
    inPersonHours: number;
    /** Online hours actually credited toward the total (min of online and cap). */
    onlineHoursCredited: number;
    /** Online hours that exceed the cap and therefore do not count. */
    onlineHoursExcess: number;
    /** Credited total (in-person + credited online). */
    creditedTotalHours: number;
    /** Hours that fell outside the certification period and were not counted. */
    outsidePeriodHours: number;
    /** Hours still needed to reach the total requirement. */
    remainingHours: number;
    /** Of the remaining hours, how many MUST be in-person (because online is capped). */
    remainingMustBeInPerson: number;
  };
  /** Plain-language statement of where the learner stands. */
  gapStatement: string;
};

export type RenewalInvalid = { valid: false; error: string };

export type RenewalEvaluation = RenewalVerdict | RenewalInvalid;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function evaluateRenewalCompliance(input: {
  effectiveDate: string | null | undefined;
  expirationDate: string | null | undefined;
  entries: ReadonlyArray<HourEntry>;
  /** Defaults to California CNA rules. Pass a different set for HHA / other states. */
  rules?: RenewalRuleSet;
}): RenewalEvaluation {
  const rules = input.rules ?? CA_CNA_RULES;

  const periodsResult = computeCertificationPeriods(
    input.effectiveDate,
    input.expirationDate,
  );
  if (!periodsResult.valid) {
    return { valid: false, error: periodsResult.error };
  }
  const periods = periodsResult.periods;

  let year1Hours = 0;
  let year2Hours = 0;
  let onlineHours = 0;
  let inPersonHours = 0;
  let outsidePeriodHours = 0;

  for (const entry of input.entries) {
    const hours = Number.isFinite(entry.hours) ? entry.hours : 0;
    if (hours <= 0) continue;

    const bucket = bucketForDate(entry.completedOn, periods);
    if (bucket === 'outside') {
      outsidePeriodHours += hours;
      continue;
    }

    if (bucket === 'year1') year1Hours += hours;
    else year2Hours += hours;

    if (entry.modality === 'online') onlineHours += hours;
    else inPersonHours += hours;
  }

  year1Hours = round2(year1Hours);
  year2Hours = round2(year2Hours);
  onlineHours = round2(onlineHours);
  inPersonHours = round2(inPersonHours);
  outsidePeriodHours = round2(outsidePeriodHours);

  const cap = rules.maximumOnlineHours;
  const onlineHoursCredited = round2(Math.min(onlineHours, cap));
  const onlineHoursExcess = round2(Math.max(0, onlineHours - cap));
  const creditedTotalHours = round2(inPersonHours + onlineHoursCredited);

  const total: RuleCheck = {
    value: creditedTotalHours,
    required: rules.totalRequiredHours,
    pass: creditedTotalHours >= rules.totalRequiredHours,
  };
  const year1: RuleCheck = {
    value: year1Hours,
    required: rules.minimumHoursPerYear,
    pass: year1Hours >= rules.minimumHoursPerYear,
  };
  const year2: RuleCheck = {
    value: year2Hours,
    required: rules.minimumHoursPerYear,
    pass: year2Hours >= rules.minimumHoursPerYear,
  };
  // Online rule passes when usage is within the cap (no excess hours).
  const online: RuleCheck = {
    value: onlineHours,
    required: cap,
    pass: onlineHours <= cap,
  };

  const compliant = total.pass && year1.pass && year2.pass && online.pass;

  const remainingHours = round2(Math.max(0, rules.totalRequiredHours - creditedTotalHours));
  // Of the hours still needed, how many must be in-person: the in-person requirement is
  // (total - cap); subtract in-person already done; never negative; never more than what's left.
  const inPersonFloor = Math.max(0, rules.totalRequiredHours - cap);
  const remainingMustBeInPerson = round2(
    Math.min(remainingHours, Math.max(0, inPersonFloor - inPersonHours)),
  );

  const gapStatement = buildGapStatement({
    rules,
    compliant,
    creditedTotalHours,
    remainingHours,
    remainingMustBeInPerson,
    year1,
    year2,
    onlineHours,
    onlineHoursExcess,
  });

  return {
    valid: true,
    compliant,
    periods,
    rules: { total, year1, year2, online },
    breakdown: {
      year1Hours,
      year2Hours,
      onlineHours,
      inPersonHours,
      onlineHoursCredited,
      onlineHoursExcess,
      creditedTotalHours,
      outsidePeriodHours,
      remainingHours,
      remainingMustBeInPerson,
    },
    gapStatement,
  };
}

function buildGapStatement(args: {
  rules: RenewalRuleSet;
  compliant: boolean;
  creditedTotalHours: number;
  remainingHours: number;
  remainingMustBeInPerson: number;
  year1: RuleCheck;
  year2: RuleCheck;
  onlineHours: number;
  onlineHoursExcess: number;
}): string {
  const {
    rules,
    compliant,
    creditedTotalHours,
    remainingHours,
    remainingMustBeInPerson,
    year1,
    year2,
    onlineHoursExcess,
  } = args;

  if (compliant) {
    return `CE requirements met: ${creditedTotalHours} of ${rules.totalRequiredHours} hours, both yearly minimums, and within the online limit. Keep your certificates and 283A log — records must be kept for 4 years.`;
  }

  const parts: string[] = [];
  parts.push(`You have ${creditedTotalHours} of ${rules.totalRequiredHours} hours that count.`);

  if (remainingHours > 0) {
    let line = `You still need ${remainingHours} more`;
    if (rules.maximumOnlineHours === 0) {
      line += ', all of which must be in-person (online hours are not accepted for this credential)';
    } else if (remainingMustBeInPerson > 0) {
      line += ` — and at least ${remainingMustBeInPerson} must be in-person, because online maxes out at ${rules.maximumOnlineHours}`;
    }
    parts.push(line + '.');
  }

  if (!year1.pass) {
    parts.push(
      `Year 1 is short ${round2(year1.required - year1.value)} hours — those must be dated inside the Year 1 window.`,
    );
  }
  if (!year2.pass) {
    parts.push(
      `Year 2 is short ${round2(year2.required - year2.value)} hours — those must be dated inside the Year 2 window.`,
    );
  }
  if (onlineHoursExcess > 0) {
    parts.push(
      `${onlineHoursExcess} online hour(s) exceed the ${rules.maximumOnlineHours}-hour online cap and do not count toward your total.`,
    );
  }

  return parts.join(' ');
}
