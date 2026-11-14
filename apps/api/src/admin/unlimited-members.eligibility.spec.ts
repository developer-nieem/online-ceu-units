import { describe, expect, it } from 'vitest';
import { OrderStatus, SubscriptionStatus } from '@calace/db';

import {
  VERIFY_NO_EXPIRATION,
  VERIFY_NO_PAID_ORDER,
  classifyIneligibleLookup,
  decideMember,
  passesSubscriptionGate,
  type GateOrder,
  type GateSubscription,
} from './unlimited-members.eligibility';

const NOW = new Date('2026-10-13T12:00:00.000Z');
const FUTURE = new Date('2028-10-13T12:00:00.000Z');
const PAST = new Date('2024-01-01T00:00:00.000Z');
const TENANT = 'tenant-cal-ace';
const OTHER = 'tenant-other';

function sub(overrides: Partial<GateSubscription> = {}): GateSubscription {
  return {
    tenantId: TENANT,
    userId: 'user-1',
    planCode: 'unlimited-2y',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: FUTURE,
    billingMeta: { provider: 'stripe' },
    user: { deletedAt: null },
    ...overrides,
  };
}

function order(overrides: Partial<GateOrder> = {}): GateOrder {
  return {
    tenantId: TENANT,
    userId: 'user-1',
    status: OrderStatus.PAID,
    placedAt: new Date('2026-06-01T00:00:00.000Z'),
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    paymentMeta: { provider: 'stripe', stripePaymentIntentId: 'pi_123' },
    lineItems: [{ type: 'subscription', plan: 'unlimited-2y', courseSlug: null }],
    ...overrides,
  };
}

const gate = { tenantId: TENANT, planCode: 'unlimited-2y', now: NOW };

describe('passesSubscriptionGate', () => {
  it('includes an active in-period Stripe 2-year subscription', () => {
    expect(passesSubscriptionGate(sub(), gate)).toBe(true);
  });

  it('includes an active Stripe subscription with no expiration on record', () => {
    expect(passesSubscriptionGate(sub({ currentPeriodEnd: null }), gate)).toBe(true);
  });

  it.each([
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.EXPIRED,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.TRIALING,
  ])('excludes status %s', (status) => {
    expect(passesSubscriptionGate(sub({ status }), gate)).toBe(false);
  });

  it('excludes an ACTIVE subscription whose period has ended', () => {
    expect(passesSubscriptionGate(sub({ currentPeriodEnd: PAST }), gate)).toBe(false);
  });

  it('excludes a mock subscription', () => {
    expect(
      passesSubscriptionGate(sub({ billingMeta: { mockPurchase: true } }), gate),
    ).toBe(false);
    expect(
      passesSubscriptionGate(sub({ billingMeta: { provider: 'mock' } }), gate),
    ).toBe(false);
  });

  it('excludes a subscription from another tenant', () => {
    expect(passesSubscriptionGate(sub({ tenantId: OTHER }), gate)).toBe(false);
  });

  it('excludes a deleted user', () => {
    expect(
      passesSubscriptionGate(sub({ user: { deletedAt: new Date() } }), gate),
    ).toBe(false);
  });
});

describe('decideMember', () => {
  it('marks a paid Stripe order plus an active in-period subscription Eligible', () => {
    const paid = order();
    const decision = decideMember(sub(), [paid], 'unlimited-2y');
    expect(decision.eligibility).toBe('eligible');
    expect(decision.verifyReason).toBeUndefined();
    expect(decision.purchaseDate?.toISOString()).toBe(paid.placedAt?.toISOString());
  });

  it('marks a paid Stripe unlimited-1y order plus an active in-period subscription Eligible', () => {
    const paid = order({
      lineItems: [{ type: 'subscription', plan: 'unlimited-1y', courseSlug: null }],
    });
    const decision = decideMember(sub({ planCode: 'unlimited-1y' }), [paid], 'unlimited-1y');
    expect(decision.eligibility).toBe('eligible');
    expect(decision.verifyReason).toBeUndefined();
    expect(decision.purchaseDate?.toISOString()).toBe(paid.placedAt?.toISOString());
  });

  it('uses the latest paid Stripe order when several exist', () => {
    const earlier = order({ placedAt: new Date('2026-01-01T00:00:00.000Z') });
    const later = order({ placedAt: new Date('2026-08-01T00:00:00.000Z') });
    const decision = decideMember(sub(), [earlier, later], 'unlimited-2y');
    expect(decision.purchaseDate?.toISOString()).toBe(later.placedAt?.toISOString());
  });

  it('keeps the member as Verify when there is no matching paid Stripe order', () => {
    const decision = decideMember(sub(), [], 'unlimited-2y');
    expect(decision.eligibility).toBe('verify');
    expect(decision.verifyReason).toBe(VERIFY_NO_PAID_ORDER);
    expect(decision.purchaseDate).toBeNull();
  });

  it.each([
    OrderStatus.FAILED,
    OrderStatus.REFUNDED,
    OrderStatus.CANCELLED,
    OrderStatus.PENDING,
  ])('does not treat a %s order as corroboration', (status) => {
    const decision = decideMember(sub(), [order({ status })], 'unlimited-2y');
    expect(decision.eligibility).toBe('verify');
    expect(decision.purchaseDate).toBeNull();
  });

  it('does not treat a mock PAID order as corroboration', () => {
    const decision = decideMember(
      sub(),
      [order({ paymentMeta: { provider: 'mock' } })],
      'unlimited-2y',
    );
    expect(decision.eligibility).toBe('verify');
    expect(decision.purchaseDate).toBeNull();
  });

  it('flags a null expiration and still keeps a paid purchase date', () => {
    const paid = order();
    const decision = decideMember(sub({ currentPeriodEnd: null }), [paid], 'unlimited-2y');
    expect(decision.eligibility).toBe('verify');
    expect(decision.verifyReason).toContain(VERIFY_NO_EXPIRATION);
    expect(decision.purchaseDate?.toISOString()).toBe(paid.placedAt?.toISOString());
  });

  it('ignores a paid order from another tenant', () => {
    const decision = decideMember(sub(), [order({ tenantId: OTHER })], 'unlimited-2y');
    expect(decision.eligibility).toBe('verify');
    expect(decision.purchaseDate).toBeNull();
  });
});

describe('classifyIneligibleLookup', () => {
  const base = { planCode: 'unlimited-2y', now: NOW, tenantId: TENANT, userId: 'user-1' };

  it('returns mock for a non-Stripe subscription', () => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [sub({ billingMeta: { provider: 'mock' } })],
        orders: [],
      }),
    ).toBe('mock');
  });

  it('returns mock for a mock PAID order and no Stripe subscription', () => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [],
        orders: [order({ paymentMeta: { provider: 'mock' } })],
      }),
    ).toBe('mock');
  });

  it('returns refunded_or_cancelled for a cancelled subscription', () => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [sub({ status: SubscriptionStatus.CANCELLED })],
        orders: [order({ status: OrderStatus.REFUNDED })],
      }),
    ).toBe('refunded_or_cancelled');
  });

  it('returns refunded_or_cancelled for a refunded order', () => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [],
        orders: [order({ status: OrderStatus.REFUNDED })],
      }),
    ).toBe('refunded_or_cancelled');
  });

  it('returns expired when the period has ended', () => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [sub({ currentPeriodEnd: PAST })],
        orders: [],
      }),
    ).toBe('expired');
  });

  it('returns expired for status EXPIRED', () => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [sub({ status: SubscriptionStatus.EXPIRED })],
        orders: [],
      }),
    ).toBe('expired');
  });

  it.each([SubscriptionStatus.PAST_DUE, SubscriptionStatus.TRIALING])(
    'returns inactive for %s',
    (status) => {
      expect(
        classifyIneligibleLookup({
          ...base,
          subscriptions: [sub({ status })],
          orders: [],
        }),
      ).toBe('inactive');
    },
  );

  it.each([OrderStatus.FAILED, OrderStatus.PENDING])('returns not_paid for a %s order', (status) => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [],
        orders: [order({ status })],
      }),
    ).toBe('not_paid');
  });

  it('does not use another tenant’s subscription to explain a miss', () => {
    expect(
      classifyIneligibleLookup({
        ...base,
        subscriptions: [sub({ tenantId: OTHER, billingMeta: { provider: 'mock' } })],
        orders: [],
      }),
    ).toBe('not_paid');
  });
});
