import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderStatus, SubscriptionStatus } from '@calace/db';

import type { PrismaService } from '../prisma/prisma.service';
import { AdminMembersService } from './admin-members.service';
import { paidRealStripeOrderWhere } from './real-stripe-order';
import { VERIFY_NO_PAID_ORDER } from './unlimited-members.eligibility';

const TENANT_ID = 'tenant-cal-ace';
const NOW = new Date('2026-10-13T12:00:00.000Z');
const FUTURE = new Date('2028-10-13T12:00:00.000Z');
const PAST = new Date('2024-01-01T00:00:00.000Z');

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    deletedAt: null,
    ...overrides,
  };
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    userId: 'user-1',
    planCode: 'unlimited-2y',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: FUTURE,
    billingMeta: { provider: 'stripe' },
    user: user(),
    ...overrides,
  };
}

function paidOrder(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: TENANT_ID,
    userId: 'user-1',
    status: OrderStatus.PAID,
    placedAt: new Date('2026-06-01T00:00:00.000Z'),
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    paymentMeta: { provider: 'stripe' },
    lineItems: [{ type: 'subscription', plan: 'unlimited-2y', courseSlug: null }],
    ...overrides,
  };
}

function createHarness(settings: Record<string, unknown> = {}) {
  const prisma = {
    tenant: {
      findFirst: vi.fn().mockResolvedValue({
        id: TENANT_ID,
        settings,
      }),
    },
    subscription: { findMany: vi.fn().mockResolvedValue([]) },
    order: { findMany: vi.fn().mockResolvedValue([]) },
    user: { findMany: vi.fn().mockResolvedValue([]) },
  };
  const service = new AdminMembersService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('AdminMembersService.listUnlimitedMembers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an eligible member for a paid Stripe order and an active in-period subscription', async () => {
    const { service, prisma } = createHarness();
    const placedAt = new Date('2026-06-01T00:00:00.000Z');
    prisma.subscription.findMany.mockResolvedValue([subscription()]);
    prisma.order.findMany.mockResolvedValue([paidOrder({ placedAt })]);

    const result = await service.listUnlimitedMembers();

    expect(result.promo).toMatchObject({
      planCode: 'unlimited-2y',
      discountAmountCents: 500,
      campusName: 'Milpitas Campus',
      enabled: true,
    });
    expect(result.members).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        membershipStatus: SubscriptionStatus.ACTIVE,
        purchaseDate: placedAt.toISOString(),
        expiresAt: FUTURE.toISOString(),
        eligibility: 'eligible',
      }),
    ]);
    expect(result.lookup).toBeUndefined();

    const subWhere = prisma.subscription.findMany.mock.calls[0]?.[0]?.where;
    expect(subWhere?.tenantId).toBe(TENANT_ID);
    expect(subWhere?.planCode).toBe('unlimited-2y');
    expect(subWhere?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(subWhere?.billingMeta).toEqual({ path: ['provider'], equals: 'stripe' });

    const orderWhere = prisma.order.findMany.mock.calls[0]?.[0]?.where;
    expect(orderWhere).toMatchObject({
      ...paidRealStripeOrderWhere(TENANT_ID),
      userId: { in: ['user-1'] },
    });
  });

  it('reads promo fields from tenant settings when present', async () => {
    const { service, prisma } = createHarness({
      milpitasCampusDiscount: { discountAmountCents: 700, campusName: 'Milpitas HQ' },
    });
    prisma.subscription.findMany.mockResolvedValue([]);

    const result = await service.listUnlimitedMembers();

    expect(result.promo.discountAmountCents).toBe(700);
    expect(result.promo.campusName).toBe('Milpitas HQ');
    expect(result.promo.planCode).toBe('unlimited-2y');
  });

  it('falls back to the default plan code when the setting is not a string', async () => {
    const { service, prisma } = createHarness({
      milpitasCampusDiscount: { planCode: 12 },
    });
    prisma.subscription.findMany.mockResolvedValue([]);

    const result = await service.listUnlimitedMembers();

    expect(result.promo.planCode).toBe('unlimited-2y');
    expect(prisma.subscription.findMany.mock.calls[0]?.[0]?.where.planCode).toBe('unlimited-2y');
  });

  it('includes a Stripe subscription with no paid order as Verify', async () => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([subscription()]);
    prisma.order.findMany.mockResolvedValue([]);

    const result = await service.listUnlimitedMembers();

    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toMatchObject({
      eligibility: 'verify',
      verifyReason: VERIFY_NO_PAID_ORDER,
      purchaseDate: null,
    });
  });

  it('drops subscriptions that fail the gate, including another tenant', async () => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([
      subscription({ tenantId: 'tenant-other', userId: 'other', user: user({ id: 'other', email: 'other@example.com' }) }),
      subscription({ status: SubscriptionStatus.CANCELLED }),
      subscription({ status: SubscriptionStatus.EXPIRED, userId: 'expired', user: user({ id: 'expired' }) }),
      subscription({ status: SubscriptionStatus.PAST_DUE, userId: 'past', user: user({ id: 'past' }) }),
      subscription({ status: SubscriptionStatus.TRIALING, userId: 'trial', user: user({ id: 'trial' }) }),
      subscription({ currentPeriodEnd: PAST, userId: 'lapsed', user: user({ id: 'lapsed' }) }),
      subscription({
        billingMeta: { provider: 'mock' },
        userId: 'mock',
        user: user({ id: 'mock', email: 'mock@example.com' }),
      }),
    ]);

    const result = await service.listUnlimitedMembers();

    expect(result.members).toEqual([]);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('scopes the lookup user query to the tenant and reports not_eligible reasons', async () => {
    const cases: Array<{
      search: string;
      subscriptions: unknown[];
      orders: unknown[];
      reason: string;
    }> = [
      {
        search: 'mock@example.com',
        subscriptions: [subscription({ billingMeta: { mockPurchase: true }, user: user({ email: 'mock@example.com' }) })],
        orders: [],
        reason: 'mock',
      },
      {
        search: 'refund@example.com',
        subscriptions: [subscription({ status: SubscriptionStatus.CANCELLED })],
        orders: [paidOrder({ status: OrderStatus.REFUNDED })],
        reason: 'refunded_or_cancelled',
      },
      {
        search: 'old@example.com',
        subscriptions: [subscription({ currentPeriodEnd: PAST })],
        orders: [],
        reason: 'expired',
      },
      {
        search: 'fail@example.com',
        subscriptions: [],
        orders: [paidOrder({ status: OrderStatus.FAILED })],
        reason: 'not_paid',
      },
    ];

    for (const entry of cases) {
      const { service, prisma } = createHarness();
      prisma.subscription.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(entry.subscriptions);
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: entry.search },
      ]);
      prisma.order.findMany.mockResolvedValue(entry.orders);

      const result = await service.listUnlimitedMembers({ search: entry.search });

      expect(result.members).toEqual([]);
      expect(result.lookup).toEqual({
        query: entry.search,
        result: 'not_eligible',
        reason: entry.reason,
      });
      expect(prisma.user.findMany.mock.calls[0]?.[0]?.where.tenantId).toBe(TENANT_ID);
    }
  });

  it('reports no_matching_member when the email is unknown', async () => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);

    const result = await service.listUnlimitedMembers({ search: 'nobody@example.com' });

    expect(result.lookup).toEqual({
      query: 'nobody@example.com',
      result: 'not_eligible',
      reason: 'no_matching_member',
    });
  });
});

function subscription1y(overrides: Record<string, unknown> = {}) {
  return subscription({ planCode: 'unlimited-1y', ...overrides });
}

function paidOrder1y(overrides: Record<string, unknown> = {}) {
  return paidOrder({
    lineItems: [{ type: 'subscription', plan: 'unlimited-1y', courseSlug: null }],
    ...overrides,
  });
}

describe('AdminMembersService.listUnlimited1yMembers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an eligible member for a paid Stripe order and an active in-period unlimited-1y subscription', async () => {
    const { service, prisma } = createHarness({
      milpitasCampusDiscount: { planCode: 'unlimited-2y', discountAmountCents: 700 },
    });
    const placedAt = new Date('2026-06-01T00:00:00.000Z');
    prisma.subscription.findMany.mockResolvedValue([subscription1y()]);
    prisma.order.findMany.mockResolvedValue([paidOrder1y({ placedAt })]);

    const result = await service.listUnlimited1yMembers();

    expect(result).not.toHaveProperty('promo');
    expect(result.members).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        membershipStatus: SubscriptionStatus.ACTIVE,
        purchaseDate: placedAt.toISOString(),
        expiresAt: FUTURE.toISOString(),
        eligibility: 'eligible',
      }),
    ]);
    expect(result.lookup).toBeUndefined();

    const subWhere = prisma.subscription.findMany.mock.calls[0]?.[0]?.where;
    expect(subWhere?.tenantId).toBe(TENANT_ID);
    expect(subWhere?.planCode).toBe('unlimited-1y');
    expect(subWhere?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(subWhere?.billingMeta).toEqual({ path: ['provider'], equals: 'stripe' });

    const orderWhere = prisma.order.findMany.mock.calls[0]?.[0]?.where;
    expect(orderWhere).toMatchObject({
      ...paidRealStripeOrderWhere(TENANT_ID),
      userId: { in: ['user-1'] },
    });
    expect(orderWhere).not.toHaveProperty('lineItems');
  });

  it('includes a Stripe subscription with no paid order as Verify', async () => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([subscription1y()]);
    prisma.order.findMany.mockResolvedValue([]);

    const result = await service.listUnlimited1yMembers();

    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toMatchObject({
      eligibility: 'verify',
      verifyReason: VERIFY_NO_PAID_ORDER,
      purchaseDate: null,
    });
  });

  it.each([
    OrderStatus.FAILED,
    OrderStatus.REFUNDED,
    OrderStatus.CANCELLED,
    OrderStatus.PENDING,
  ])('keeps Verify when the only unlimited-1y order is %s', async (status) => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([subscription1y()]);
    prisma.order.findMany.mockResolvedValue([paidOrder1y({ status })]);

    const result = await service.listUnlimited1yMembers();

    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toMatchObject({
      eligibility: 'verify',
      verifyReason: VERIFY_NO_PAID_ORDER,
    });
  });

  it('keeps Verify when the only paid order is a mock checkout', async () => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([subscription1y()]);
    prisma.order.findMany.mockResolvedValue([
      paidOrder1y({ paymentMeta: { provider: 'mock' } }),
    ]);

    const result = await service.listUnlimited1yMembers();

    expect(result.members).toHaveLength(1);
    expect(result.members[0]?.eligibility).toBe('verify');
  });

  it('drops subscriptions that fail the gate, including another tenant', async () => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([
      subscription1y({
        tenantId: 'tenant-other',
        userId: 'other',
        user: user({ id: 'other', email: 'other@example.com' }),
      }),
      subscription1y({ status: SubscriptionStatus.CANCELLED }),
      subscription1y({
        status: SubscriptionStatus.EXPIRED,
        userId: 'expired',
        user: user({ id: 'expired' }),
      }),
      subscription1y({
        status: SubscriptionStatus.PAST_DUE,
        userId: 'past',
        user: user({ id: 'past' }),
      }),
      subscription1y({
        status: SubscriptionStatus.TRIALING,
        userId: 'trial',
        user: user({ id: 'trial' }),
      }),
      subscription1y({
        currentPeriodEnd: PAST,
        userId: 'lapsed',
        user: user({ id: 'lapsed' }),
      }),
      subscription1y({
        billingMeta: { provider: 'mock' },
        userId: 'mock',
        user: user({ id: 'mock', email: 'mock@example.com' }),
      }),
    ]);

    const result = await service.listUnlimited1yMembers();

    expect(result.members).toEqual([]);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('scopes the lookup user query to the tenant and reports not_eligible reasons', async () => {
    const cases: Array<{
      search: string;
      subscriptions: unknown[];
      orders: unknown[];
      reason: string;
    }> = [
      {
        search: 'mock@example.com',
        subscriptions: [
          subscription1y({
            billingMeta: { mockPurchase: true },
            user: user({ email: 'mock@example.com' }),
          }),
        ],
        orders: [],
        reason: 'mock',
      },
      {
        search: 'refund@example.com',
        subscriptions: [subscription1y({ status: SubscriptionStatus.CANCELLED })],
        orders: [paidOrder1y({ status: OrderStatus.REFUNDED })],
        reason: 'refunded_or_cancelled',
      },
      {
        search: 'old@example.com',
        subscriptions: [subscription1y({ currentPeriodEnd: PAST })],
        orders: [],
        reason: 'expired',
      },
      {
        search: 'fail@example.com',
        subscriptions: [],
        orders: [paidOrder1y({ status: OrderStatus.FAILED })],
        reason: 'not_paid',
      },
    ];

    for (const entry of cases) {
      const { service, prisma } = createHarness();
      prisma.subscription.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(entry.subscriptions);
      prisma.user.findMany.mockResolvedValue([{ id: 'user-1', email: entry.search }]);
      prisma.order.findMany.mockResolvedValue(entry.orders);

      const result = await service.listUnlimited1yMembers({ search: entry.search });

      expect(result.members).toEqual([]);
      expect(result.lookup).toEqual({
        query: entry.search,
        result: 'not_eligible',
        reason: entry.reason,
      });
      expect(prisma.user.findMany.mock.calls[0]?.[0]?.where.tenantId).toBe(TENANT_ID);
    }
  });

  it('reports no_matching_member when the email is unknown', async () => {
    const { service, prisma } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);

    const result = await service.listUnlimited1yMembers({ search: 'nobody@example.com' });

    expect(result.lookup).toEqual({
      query: 'nobody@example.com',
      result: 'not_eligible',
      reason: 'no_matching_member',
    });
  });
});
