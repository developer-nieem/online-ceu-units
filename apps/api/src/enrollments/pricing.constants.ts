export const PURCHASE_PLANS = ['single', 'unlimited-1y', 'unlimited-2y'] as const;
export type PurchasePlan = (typeof PURCHASE_PLANS)[number];

export const PLAN_PRICES: Record<PurchasePlan, number> = {
  single: 3.75,
  'unlimited-1y': 19.5,
  'unlimited-2y': 37.5,
};

export const SUBSCRIPTION_PLAN_CODES = ['unlimited-1y', 'unlimited-2y'] as const;

export function isSubscriptionPlan(plan: PurchasePlan): boolean {
  return (SUBSCRIPTION_PLAN_CODES as readonly string[]).includes(plan);
}
