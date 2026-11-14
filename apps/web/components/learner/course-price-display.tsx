'use client';

import type { CmsCoursePricing } from '@/lib/cms/types';
import { formatUsdFromCents, getEffectivePriceCents } from '@/lib/checkout/pricing';

export function CoursePriceDisplay({
  pricing,
  className = '',
  size = 'md',
}: {
  pricing: CmsCoursePricing;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const effective = getEffectivePriceCents(pricing);
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  if (pricing.isFree || effective === 0) {
    return (
      <span className={`font-semibold text-emerald-700 ${textSize} ${className}`}>Free</span>
    );
  }

  if (!pricing.pricingActive) {
    return (
      <span className={`text-slate-500 ${textSize} ${className}`}>Pricing unavailable</span>
    );
  }

  const hasSale =
    typeof pricing.salePriceCents === 'number' &&
    pricing.salePriceCents >= 0 &&
    pricing.salePriceCents < pricing.priceCents;

  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      {hasSale ? (
        <>
          <span className={`font-semibold text-slate-900 ${textSize}`}>
            {formatUsdFromCents(effective)}
          </span>
          <span className="text-sm text-slate-400 line-through">
            {formatUsdFromCents(pricing.priceCents)}
          </span>
        </>
      ) : (
        <span className={`font-semibold text-slate-900 ${textSize}`}>
          {formatUsdFromCents(effective)}
        </span>
      )}
    </span>
  );
}

export function courseActionLabel(pricing: CmsCoursePricing): string {
  if (pricing.isFree || getEffectivePriceCents(pricing) === 0) {
    return 'Start for Free';
  }
  if (pricing.pricingActive) {
    return 'Buy course';
  }
  return 'Enroll';
}
