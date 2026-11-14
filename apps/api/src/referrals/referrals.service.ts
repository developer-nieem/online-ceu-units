import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, ReferralRewardReason, ReferralStatus } from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_LABELS: Record<string, string> = {
  single: 'Single Course',
  'unlimited-1y': '1-Year Unlimited',
  'unlimited-2y': '2-Year Unlimited',
};

function parsePackagePurchased(lineItems: unknown): string | null {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return null;
  const item = lineItems[0];
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  if (typeof record.courseTitle === 'string') return record.courseTitle;
  if (typeof record.plan === 'string') {
    return PLAN_LABELS[record.plan] ?? record.plan;
  }
  return null;
}

export type ReferralStatsResponse = {
  referralCode: string;
  referralLink: string;
  stats: {
    pending: number;
    converted: number;
    rewarded: number;
    totalRewardCents: number;
  };
  referrals: Array<{
    referralId: string;
    refereeName: string;
    refereeEmail: string;
    status: string;
    packagePurchased: string | null;
    convertedAt: string | null;
    rewardAmountCents: number | null;
    rewardExpiresAt: string | null;
    createdAt: string;
  }>;
};

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getMyStats(user: AuthUser): Promise<ReferralStatsResponse> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { referralCode: true },
    });

    if (!dbUser?.referralCode) {
      throw new NotFoundException('Referral code not found');
    }

    const [statusCounts, rewardAggregate, referrals, rewards] = await Promise.all([
      this.prisma.referral.groupBy({
        by: ['status'],
        where: { referrerId: user.userId },
        _count: { _all: true },
      }),
      this.prisma.referral.aggregate({
        where: { referrerId: user.userId, status: ReferralStatus.REWARDED },
        _sum: { rewardAmountCents: true },
      }),
      this.prisma.referral.findMany({
        where: { referrerId: user.userId },
        include: {
          referree: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.referralReward.findMany({
        where: {
          userId: user.userId,
          reason: ReferralRewardReason.REFERRAL_CONVERSION,
        },
        select: { expiresAt: true, createdAt: true },
      }),
    ]);

    const referreeIds = referrals.map((referral) => referral.referreeId);
    const referreeOrders =
      referreeIds.length > 0
        ? await this.prisma.order.findMany({
            where: {
              userId: { in: referreeIds },
              status: OrderStatus.PAID,
            },
            select: { userId: true, lineItems: true, placedAt: true, createdAt: true },
            orderBy: [{ placedAt: 'asc' }, { createdAt: 'asc' }],
          })
        : [];

    const firstOrderByReferree = new Map<string, (typeof referreeOrders)[number]>();
    for (const order of referreeOrders) {
      if (!firstOrderByReferree.has(order.userId)) {
        firstOrderByReferree.set(order.userId, order);
      }
    }

    const rewardByRewardedAt = new Map<number, (typeof rewards)[number]>();
    for (const reward of rewards) {
      rewardByRewardedAt.set(reward.createdAt.getTime(), reward);
    }

    const referralDetails = referrals.map((referral) => {
      const refereeName = [referral.referree.firstName, referral.referree.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const firstOrder = firstOrderByReferree.get(referral.referreeId);
      const packagePurchased = firstOrder
        ? parsePackagePurchased(firstOrder.lineItems)
        : null;
      const matchedReward =
        referral.rewardedAt != null
          ? rewardByRewardedAt.get(referral.rewardedAt.getTime())
          : undefined;

      return {
        referralId: referral.id,
        refereeName,
        refereeEmail: referral.referree.email,
        status: referral.status,
        packagePurchased,
        convertedAt: referral.convertedAt?.toISOString() ?? null,
        rewardAmountCents: referral.rewardAmountCents,
        rewardExpiresAt: matchedReward?.expiresAt?.toISOString() ?? null,
        createdAt: referral.createdAt.toISOString(),
      };
    });

    const countByStatus = (status: ReferralStatus) =>
      statusCounts.find((row) => row.status === status)?._count._all ?? 0;

    const webUrl = this.config.get<string>('WEB_URL', 'https://onlineceunits.com');
    const referralLink = `${webUrl}/signup?ref=${dbUser.referralCode}`;

    return {
      referralCode: dbUser.referralCode,
      referralLink,
      stats: {
        pending: countByStatus(ReferralStatus.PENDING),
        converted: countByStatus(ReferralStatus.CONVERTED),
        rewarded: countByStatus(ReferralStatus.REWARDED),
        totalRewardCents: rewardAggregate._sum.rewardAmountCents ?? 0,
      },
      referrals: referralDetails,
    };
  }
}
