import type { Prisma } from '@calace/db';

type CatalogPricing = {
  isFree?: boolean;
  priceCents?: number;
  pricingActive?: boolean;
  salePriceCents?: number | null;
};

type CatalogData = {
  price?: number;
  pricing?: CatalogPricing;
};

/** True when catalogData marks a course as free (pricing flag or zero price). */
export function isFreeFromCatalogData(catalogData: Prisma.JsonValue | null | undefined): boolean {
  const meta = (catalogData ?? {}) as CatalogData;
  const pricing = meta.pricing;

  if (pricing?.isFree) return true;
  if (typeof pricing?.priceCents === 'number' && pricing.priceCents === 0) return true;
  if (typeof meta.price === 'number' && meta.price === 0) return true;

  return false;
}

export function catalogPriceFromData(
  catalogData: Prisma.JsonValue | null | undefined,
  defaultPrice: number,
): number {
  const meta = (catalogData ?? {}) as CatalogData;
  if (isFreeFromCatalogData(catalogData)) return 0;
  return typeof meta.price === 'number' ? meta.price : defaultPrice;
}
