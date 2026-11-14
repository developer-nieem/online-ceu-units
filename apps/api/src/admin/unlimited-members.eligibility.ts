import { OrderStatus, SubscriptionStatus } from '@calace/db';

export const VERIFY_NO_PAID_ORDER =
  'no matching paid Stripe order — confirm manually';
export const VERIFY_NO_EXPIRATION = 'no expiration on record — verify';

export type MemberEligibility = 'eligible' | 'verify';

export type IneligibleLookupReason =
  | 'no_matching_member'
  | 'not_paid'
  | 'mock'
  | 'inactive'
  | 'expired'
  | 'refunded_or_cancelled';

export type GateSubscription = {
  tenantId: string;
  userId: string;
  planCode: string;
  status: string;
  currentPeriodEnd: Date | null;
  billingMeta: unknown;
  user?: { deletedAt: Date | null } | null;
};

export type GateOrder = {
  tenantId: string;
  userId: string;
  status: string;
  placedAt: Date | null;
  createdAt: Date;
  paymentMeta: unknown;
  lineItems: unknown;
};

export type MemberDecision = {
  eligibility: MemberEligibility;
  verifyReason?: string;
  purchaseDate: Date | null;
};

function jsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function paymentProvider(meta: unknown): string | null {
  const provider = jsonRecord(meta).provider;
  return typeof provider === 'string' ? provider : null;
}

export function lineItemPlan(lineItems: unknown): string | null {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return null;
  const first = lineItems[0];
  if (!first || typeof first !== 'object') return null;
  const plan = (first as Record<string, unknown>).plan;
  return typeof plan === 'string' ? plan : null;
}

export function passesSubscriptionGate(
  sub: GateSubscription,
  params: { tenantId: string; planCode: string; now: Date },
): boolean {
  if (sub.tenantId !== params.tenantId) return false;
  if (sub.planCode !== params.planCode) return false;
  if (sub.status !== SubscriptionStatus.ACTIVE) return false;
  if (sub.user?.deletedAt) return false;
  if (paymentProvider(sub.billingMeta) !== 'stripe') return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd <= params.now) return false;
  return true;
}

export function isCorroboratingPaidOrder(
  order: GateOrder,
  params: { tenantId: string; userId: string; planCode: string },
): boolean {
  if (order.tenantId !== params.tenantId || order.userId !== params.userId) return false;
  if (order.status !== OrderStatus.PAID) return false;
  if (paymentProvider(order.paymentMeta) !== 'stripe') return false;
  return lineItemPlan(order.lineItems) === params.planCode;
}

function purchaseInstant(order: GateOrder): Date {
  return order.placedAt ?? order.createdAt;
}

export function latestCorroboratingOrder(
  orders: GateOrder[],
  params: { tenantId: string; userId: string; planCode: string },
): GateOrder | null {
  const matches = orders.filter((order) => isCorroboratingPaidOrder(order, params));
  if (matches.length === 0) return null;
  return matches.reduce((latest, order) =>
    purchaseInstant(order) > purchaseInstant(latest) ? order : latest,
  );
}

/**
 * Members who pass the subscription gate are always kept. A missing paid
 * Stripe order or a null period end flags them for staff verification.
 */
export function decideMember(
  sub: GateSubscription,
  orders: GateOrder[],
  planCode: string,
): MemberDecision {
  const latest = latestCorroboratingOrder(orders, {
    tenantId: sub.tenantId,
    userId: sub.userId,
    planCode,
  });
  const reasons: string[] = [];
  if (!latest) reasons.push(VERIFY_NO_PAID_ORDER);
  if (!sub.currentPeriodEnd) reasons.push(VERIFY_NO_EXPIRATION);

  if (reasons.length === 0) {
    return {
      eligibility: 'eligible',
      purchaseDate: purchaseInstant(latest!),
    };
  }

  return {
    eligibility: 'verify',
    verifyReason: reasons.join('; '),
    purchaseDate: latest ? purchaseInstant(latest) : null,
  };
}

export function classifyIneligibleLookup(input: {
  subscriptions: GateSubscription[];
  orders: GateOrder[];
  planCode: string;
  now: Date;
  tenantId: string;
  userId: string;
}): IneligibleLookupReason {
  const subs = input.subscriptions.filter(
    (sub) =>
      sub.tenantId === input.tenantId &&
      sub.userId === input.userId &&
      sub.planCode === input.planCode,
  );
  const orders = input.orders.filter(
    (order) =>
      order.tenantId === input.tenantId &&
      order.userId === input.userId &&
      lineItemPlan(order.lineItems) === input.planCode,
  );

  const stripeSubs = subs.filter((sub) => paymentProvider(sub.billingMeta) === 'stripe');
  const mockPaidOrder = orders.some(
    (order) => order.status === OrderStatus.PAID && paymentProvider(order.paymentMeta) !== 'stripe',
  );
  if (stripeSubs.length === 0 && (subs.length > 0 || mockPaidOrder)) {
    return 'mock';
  }

  if (
    stripeSubs.some((sub) => sub.status === SubscriptionStatus.CANCELLED) ||
    orders.some(
      (order) => order.status === OrderStatus.REFUNDED || order.status === OrderStatus.CANCELLED,
    )
  ) {
    return 'refunded_or_cancelled';
  }

  if (
    stripeSubs.some((sub) => sub.status === SubscriptionStatus.EXPIRED) ||
    stripeSubs.some(
      (sub) =>
        sub.status === SubscriptionStatus.ACTIVE &&
        sub.currentPeriodEnd !== null &&
        sub.currentPeriodEnd <= input.now,
    )
  ) {
    return 'expired';
  }

  if (
    stripeSubs.some(
      (sub) =>
        sub.status === SubscriptionStatus.PAST_DUE || sub.status === SubscriptionStatus.TRIALING,
    )
  ) {
    return 'inactive';
  }

  return 'not_paid';
}

export function pickLookupUser<T extends { email: string }>(
  users: T[],
  search: string,
): T | null {
  if (users.length === 0) return null;
  const query = search.trim().toLowerCase();
  const exact = users.find((user) => user.email.toLowerCase() === query);
  if (exact) return exact;
  const only = users[0];
  if (users.length === 1 && only) return only;
  return null;
}
