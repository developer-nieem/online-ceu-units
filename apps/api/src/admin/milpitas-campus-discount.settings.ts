/**
 * Tenant.settings.milpitasCampusDiscount — display and eligibility rule for the
 * Milpitas in-person CEU discount. Defaults match the current promo. No editor
 * in this pass; callers only read the merged value.
 *
 * TODO: TWO_YEAR_MILPITAS_PROMO in apps/web/lib/marketing-copy.ts should
 * eventually read this same setting. The duplication is intentional for now.
 */
export const MILPITAS_CAMPUS_DISCOUNT_SETTINGS_KEY = 'milpitasCampusDiscount';

export type MilpitasCampusDiscountSettings = {
  planCode: string;
  discountAmountCents: number;
  campusName: string;
  enabled: boolean;
};

export const DEFAULT_MILPITAS_CAMPUS_DISCOUNT_SETTINGS: MilpitasCampusDiscountSettings = {
  planCode: 'unlimited-2y',
  discountAmountCents: 500,
  campusName: 'Milpitas Campus',
  enabled: true,
};

export function mergeMilpitasCampusDiscountSettings(
  raw: unknown,
): MilpitasCampusDiscountSettings {
  const partial =
    raw && typeof raw === 'object' ? (raw as Partial<MilpitasCampusDiscountSettings>) : {};
  const merged = { ...DEFAULT_MILPITAS_CAMPUS_DISCOUNT_SETTINGS, ...partial };
  return {
    planCode:
      typeof merged.planCode === 'string' && merged.planCode.trim()
        ? merged.planCode.trim()
        : DEFAULT_MILPITAS_CAMPUS_DISCOUNT_SETTINGS.planCode,
    discountAmountCents:
      typeof merged.discountAmountCents === 'number' && Number.isFinite(merged.discountAmountCents)
        ? merged.discountAmountCents
        : DEFAULT_MILPITAS_CAMPUS_DISCOUNT_SETTINGS.discountAmountCents,
    campusName:
      typeof merged.campusName === 'string' && merged.campusName.trim()
        ? merged.campusName.trim()
        : DEFAULT_MILPITAS_CAMPUS_DISCOUNT_SETTINGS.campusName,
    enabled:
      typeof merged.enabled === 'boolean'
        ? merged.enabled
        : DEFAULT_MILPITAS_CAMPUS_DISCOUNT_SETTINGS.enabled,
  };
}
