export const CDPH_ONLINE_PROVIDER_LINE =
  'CDPH-Approved Online CE Provider — NAC# 7384';

/** Shared high-conversion marketing selling points for landing and pricing surfaces. */
export const MARKETING_SELLING_POINTS = {
  unlimitedAccess:
    'Your plan includes every course in the catalogue — no add-ons, no upgrades.',
  compliance: CDPH_ONLINE_PROVIDER_LINE,
  tools:
    'Keep track of all your credits for easy review and submission at any time. Utilize our unique CEU Math feature to easily calculate your required hours.',
  inPerson:
    "Don't forget to check out our in-person classes with CAL ACE Nursing Academy at our California locations!",
} as const;

export const UNLIMITED_PLAN_FEATURES = [
  MARKETING_SELLING_POINTS.unlimitedAccess,
  MARKETING_SELLING_POINTS.compliance,
  MARKETING_SELLING_POINTS.tools,
] as const;

/**
 * 2-Year Unlimited hybrid-learning incentive — Milpitas campus in-person CEU discount.
 *
 * TODO: TWO_YEAR_MILPITAS_PROMO should eventually be read from
 * Tenant.settings.milpitasCampusDiscount (planCode, discountAmountCents,
 * campusName, enabled) — the same setting the admin eligibility view uses.
 * Left duplicated on purpose for this pass.
 */
export const TWO_YEAR_MILPITAS_PROMO = {
  headline: 'INCLUDED WITH THE 2-YEAR PLAN',
  shortHeadline: '2-Year plan includes $5 off in-person CEUs at Milpitas',
  heroBody:
    'Lock in the 2-Year Unlimited Plan and instantly unlock a $5 VIP discount for any in-person CEU class at our flagship Milpitas Campus! Get the best of online convenience plus in-person classes at our Milpitas campus.',
  stripBody:
    '2-Year Unlimited members get $5 off any in-person CEU at our Milpitas Campus — online convenience plus in-person classes at Milpitas.',
  pricingBonus: 'BONUS: $5 Off In-Person CEUs (Milpitas Campus)',
  pricingBonusShort: '$5 off in-person CEUs at Milpitas Campus (exclusive)',
  campusName: 'Milpitas Campus',
  discountAmount: '$5',
  redemptionTitle: 'Your Milpitas Campus Discount is Active!',
  redemptionBody:
    'Show this dashboard at the Milpitas campus front desk to claim your $5 discount on any in-person CEU class. This offer applies exclusively to in-person CEUs at our flagship Milpitas location.',
  successBody:
    'Your $5 VIP discount for in-person CEUs at the Milpitas Campus is now active. Visit the dashboard anytime for redemption instructions.',
  conditions:
    'The $5 Discount applies to in-person CEU classes only, exclusively at the CAL ACE Nursing Academy Milpitas Campus (Main HQ). Not valid at pop-up or satellite locations.',
} as const;

export const TWO_YEAR_PLAN_ID = 'unlimited-2y' as const;
