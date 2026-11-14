import type { Prisma } from '@calace/db';

import type { CmsCoursePricing } from '@/lib/cms/types';
import { isFreeCourse, requiresCheckout } from '@/lib/checkout/pricing';

type CatalogData = {
  price?: number;
  pricing?: Partial<CmsCoursePricing>;
};

/** True when catalogData marks a course as free (pricing flag or zero price). */
export function isFreeFromCatalogData(catalogData: Prisma.JsonValue | null | undefined): boolean {
  const meta = (catalogData ?? {}) as CatalogData;
  const pricing = meta.pricing;

  if (pricing && isFreeCourse(pricing as CmsCoursePricing)) return true;
  if (typeof meta.price === 'number' && meta.price === 0) return true;

  return false;
}

export function courseRequiresCheckout(catalogData: Prisma.JsonValue | null | undefined): boolean {
  if (isFreeFromCatalogData(catalogData)) return false;

  const meta = (catalogData ?? {}) as CatalogData;
  const pricing = meta.pricing;
  if (!pricing) return true;

  return requiresCheckout(pricing as CmsCoursePricing);
}
