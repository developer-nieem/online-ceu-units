import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@calace/db';

import { PrismaService } from '../prisma/prisma.service';
import { AdminBaseService } from './admin-base.service';
import {
  mergeMilpitasCampusDiscountSettings,
  MILPITAS_CAMPUS_DISCOUNT_SETTINGS_KEY,
  type MilpitasCampusDiscountSettings,
} from './milpitas-campus-discount.settings';
import { paidRealStripeOrderWhere } from './real-stripe-order';
import {
  classifyIneligibleLookup,
  decideMember,
  passesSubscriptionGate,
  pickLookupUser,
  type GateOrder,
  type GateSubscription,
  type IneligibleLookupReason,
  type MemberEligibility,
} from './unlimited-members.eligibility';

export type UnlimitedMemberRow = {
  userId: string;
  fullName: string;
  email: string;
  membershipStatus: string;
  purchaseDate: string | null;
  expiresAt: string | null;
  eligibility: MemberEligibility;
  verifyReason?: string;
};

export type UnlimitedMembersLookup = {
  query: string;
  result: 'eligible' | 'not_eligible';
  reason?: IneligibleLookupReason;
};

export type UnlimitedMembersList = {
  members: UnlimitedMemberRow[];
  lookup?: UnlimitedMembersLookup;
};

export type UnlimitedMembersResponse = UnlimitedMembersList & {
  promo: MilpitasCampusDiscountSettings;
};

export type Unlimited1yMembersResponse = UnlimitedMembersList;

const UNLIMITED_1Y_PLAN_CODE = 'unlimited-1y';

type SubscriptionRow = GateSubscription & {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    deletedAt: Date | null;
  } | null;
};

@Injectable()
export class AdminMembersService extends AdminBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async listUnlimitedMembers(params?: { search?: string }): Promise<UnlimitedMembersResponse> {
    const tenantId = await this.getTenantId();
    const promo = await this.loadPromo(tenantId);
    const listed = await this.listMembersForPlan(tenantId, promo.planCode, params);
    return { promo, ...listed };
  }

  async listUnlimited1yMembers(params?: { search?: string }): Promise<Unlimited1yMembersResponse> {
    const tenantId = await this.getTenantId();
    return this.listMembersForPlan(tenantId, UNLIMITED_1Y_PLAN_CODE, params);
  }

  private async listMembersForPlan(
    tenantId: string,
    planCode: string,
    params?: { search?: string },
  ): Promise<UnlimitedMembersList> {
    const now = new Date();
    const search = params?.search?.trim() ?? '';

    const subscriptions = (await this.prisma.subscription.findMany({
      where: this.subscriptionWhere(tenantId, planCode, now, search),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            deletedAt: true,
          },
        },
      },
    })) as SubscriptionRow[];

    const passing = this.dedupeByUser(
      subscriptions.filter((sub) => passesSubscriptionGate(sub, { tenantId, planCode, now })),
    );

    const orders = await this.loadCorroboratingOrders(
      tenantId,
      passing.map((sub) => sub.userId),
    );

    const members = passing
      .filter((sub) => sub.user && !sub.user.deletedAt)
      .map((sub) => this.toMember(sub, orders, planCode))
      .sort((a, b) => a.fullName.localeCompare(b.fullName) || a.email.localeCompare(b.email));

    const response: UnlimitedMembersList = { members };
    if (search) {
      response.lookup =
        members.length > 0
          ? { query: search, result: 'eligible' }
          : {
              query: search,
              result: 'not_eligible',
              reason: await this.lookupReason(tenantId, planCode, search, now),
            };
    }
    return response;
  }

  private async loadPromo(tenantId: string): Promise<MilpitasCampusDiscountSettings> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { settings: true },
    });
    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    return mergeMilpitasCampusDiscountSettings(settings[MILPITAS_CAMPUS_DISCOUNT_SETTINGS_KEY]);
  }

  private subscriptionWhere(
    tenantId: string,
    planCode: string,
    now: Date,
    search: string,
  ): Prisma.SubscriptionWhereInput {
    const user: Prisma.UserWhereInput = { deletedAt: null };
    if (search) {
      user.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    return {
      tenantId,
      planCode,
      status: SubscriptionStatus.ACTIVE,
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
      billingMeta: { path: ['provider'], equals: 'stripe' },
      user,
    };
  }

  private async loadCorroboratingOrders(
    tenantId: string,
    userIds: string[],
  ): Promise<GateOrder[]> {
    if (userIds.length === 0) return [];
    // Plan matching is done in memory by isCorroboratingPaidOrder (see
    // unlimited-members.eligibility), the same way referrals read
    // lineItems[0].plan. Filtering it in the DB WHERE needs a JSON
    // array-index path filter, which is not supported here — so we fetch the
    // paid Stripe orders for these users and match the plan in JS.
    return this.prisma.order.findMany({
      where: {
        ...paidRealStripeOrderWhere(tenantId),
        userId: { in: userIds },
      },
      select: {
        tenantId: true,
        userId: true,
        status: true,
        placedAt: true,
        createdAt: true,
        paymentMeta: true,
        lineItems: true,
      },
    });
  }

  private dedupeByUser(subs: SubscriptionRow[]): SubscriptionRow[] {
    const byUser = new Map<string, SubscriptionRow>();
    for (const sub of subs) {
      const existing = byUser.get(sub.userId);
      if (!existing) {
        byUser.set(sub.userId, sub);
        continue;
      }
      byUser.set(sub.userId, preferSubscription(existing, sub));
    }
    return [...byUser.values()];
  }

  private toMember(
    sub: SubscriptionRow,
    orders: GateOrder[],
    planCode: string,
  ): UnlimitedMemberRow {
    const user = sub.user!;
    const decision = decideMember(sub, orders, planCode);
    const fullName = [user.firstName, user.lastName]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(' ');
    return {
      userId: sub.userId,
      fullName,
      email: user.email,
      membershipStatus: sub.status,
      purchaseDate: decision.purchaseDate?.toISOString() ?? null,
      expiresAt: sub.currentPeriodEnd?.toISOString() ?? null,
      eligibility: decision.eligibility,
      ...(decision.verifyReason ? { verifyReason: decision.verifyReason } : {}),
    };
  }

  private async lookupReason(
    tenantId: string,
    planCode: string,
    search: string,
    now: Date,
  ): Promise<IneligibleLookupReason> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: { id: true, email: true },
      take: 10,
    });
    const user = pickLookupUser(users, search);
    if (!user) return 'no_matching_member';

    const [subscriptions, orders] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { tenantId, userId: user.id, planCode },
        select: {
          tenantId: true,
          userId: true,
          planCode: true,
          status: true,
          currentPeriodEnd: true,
          billingMeta: true,
        },
      }),
      this.prisma.order.findMany({
        where: { tenantId, userId: user.id },
        select: {
          tenantId: true,
          userId: true,
          status: true,
          placedAt: true,
          createdAt: true,
          paymentMeta: true,
          lineItems: true,
        },
      }),
    ]);

    return classifyIneligibleLookup({
      subscriptions,
      orders,
      planCode,
      now,
      tenantId,
      userId: user.id,
    });
  }
}

function preferSubscription(current: SubscriptionRow, candidate: SubscriptionRow): SubscriptionRow {
  if (!current.currentPeriodEnd) return candidate.currentPeriodEnd ? candidate : current;
  if (!candidate.currentPeriodEnd) return current;
  return candidate.currentPeriodEnd > current.currentPeriodEnd ? candidate : current;
}
