import type { CmsCoursePricing } from '@/lib/cms/types';
import { DEFAULT_COURSE_PRICING } from '@/lib/cms/types';

export function normalizeCoursePricing(pricing?: Partial<CmsCoursePricing> | null): CmsCoursePricing {
  if (!pricing) {
    return { ...DEFAULT_COURSE_PRICING };
  }

  return {
    priceCents: typeof pricing.priceCents === 'number' ? pricing.priceCents : DEFAULT_COURSE_PRICING.priceCents,
    salePriceCents:
      pricing.salePriceCents === null || typeof pricing.salePriceCents === 'number'
        ? pricing.salePriceCents
        : null,
    pricingActive: pricing.pricingActive ?? DEFAULT_COURSE_PRICING.pricingActive,
    isFree: pricing.isFree ?? DEFAULT_COURSE_PRICING.isFree,
  };
}

/** Effective charge in cents — sale price when set and lower than list price. */
export function getEffectivePriceCents(pricing: CmsCoursePricing): number {
  if (pricing.isFree || !pricing.pricingActive) {
    return 0;
  }

  const list = Math.max(0, pricing.priceCents);
  const sale = pricing.salePriceCents;

  if (typeof sale === 'number' && sale >= 0 && sale < list) {
    return sale;
  }

  return list;
}

export function isFreeCourse(pricing: CmsCoursePricing): boolean {
  return pricing.isFree || getEffectivePriceCents(pricing) === 0;
}

export function requiresCheckout(pricing: CmsCoursePricing): boolean {
  return pricing.pricingActive && !isFreeCourse(pricing);
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}
