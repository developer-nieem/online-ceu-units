export const SINGLE_COURSE_PRICE = 3.75;

export const PRICING_PLANS = [
  {
    id: 'single',
    name: 'Single Course',
    price: 3.75,
    period: 'per course',
    description: 'Pay only for the CEU courses you need.',
    highlight: false,
  },
  {
    id: 'unlimited-1y',
    name: '1-Year Unlimited',
    price: 19.5,
    period: 'per year',
    description:
      'Unlimited online CEUs for one year — access all available online CE courses for 12 months.',
    highlight: true,
  },
  {
    id: 'unlimited-2y',
    name: '2-Year Unlimited',
    price: 37.5,
    period: 'every 2 years',
    description: 'Maximum savings for multi-year CNA certification cycles.',
    highlight: false,
  },
] as const;

export type PurchasePlanId = (typeof PRICING_PLANS)[number]['id'];

export function individualCatalogTotal(paidCourseCount: number): number {
  return SINGLE_COURSE_PRICE * Math.max(0, paidCourseCount);
}

export function planSavings(planPrice: number, paidCourseCount: number): number {
  return Math.max(0, individualCatalogTotal(paidCourseCount) - planPrice);
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
