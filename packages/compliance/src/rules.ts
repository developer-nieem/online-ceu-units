/**
 * Renewal rule sets — the numbers behind the law, expressed as data (Rules-as-Settings).
 *
 * GROUND TRUTH (CALACE_CNA_RENEWAL_COMPLIANCE_SPEC, Section 2):
 *   CNA must satisfy ALL THREE independently over the 2-year period:
 *     1. 48 total CE/in-service hours
 *     2. at least 12 hours in EACH year (not 0 + 48)
 *     3. no more than 24 hours from online programs
 *   HHA renewal: per spec/planner, HHAs cannot use ANY online CE — online cap is 0.
 *
 * These are the CALIFORNIA defaults. They are SETTINGS, not hard-coded law in the
 * engine — a different state/profession can pass its own RenewalRuleSet. The engine
 * never assumes these numbers; it reads them from the rule set it is given.
 */

export type RenewalRuleSet = {
  /** Total CE/in-service hours required across the whole period. */
  totalRequiredHours: number;
  /** Minimum hours required in EACH year of the period (enforced per-year). */
  minimumHoursPerYear: number;
  /** Maximum hours that may come from online delivery. 0 means online not accepted. */
  maximumOnlineHours: number;
  /** Label for messaging (e.g. 'CNA', 'HHA'). */
  label: string;
};

/** California CNA — 48 total / 12 per year / 24 online cap. */
export const CA_CNA_RULES: RenewalRuleSet = {
  totalRequiredHours: 48,
  minimumHoursPerYear: 12,
  maximumOnlineHours: 24,
  label: 'CNA',
};

/** California HHA — 24 total, no online hours accepted. */
export const CA_HHA_RULES: RenewalRuleSet = {
  totalRequiredHours: 24,
  minimumHoursPerYear: 12,
  maximumOnlineHours: 0,
  label: 'HHA',
};
