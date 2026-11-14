import { Injectable } from '@nestjs/common';
import {
  CompletionStatus,
  CourseMilestoneBadge,
  GamificationEventType,
} from '@calace/db';

import { PrismaService } from '../prisma/prisma.service';
import {
  COURSE_MILESTONE_THRESHOLDS,
  MILESTONE_BADGE_META,
  type EarnedMilestoneBadgePayload,
} from './milestone-badge.types';

@Injectable()
export class MilestoneBadgeService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAndAwardMilestoneBadge(
    userId: string,
    tenantId: string,
  ): Promise<EarnedMilestoneBadgePayload | null> {
    const coursesCompleted = await this.prisma.completion.count({
      where: { userId, status: CompletionStatus.APPROVED },
    });

    const milestone = this.resolveMilestone(coursesCompleted);
    if (!milestone) return null;

    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_milestone: { userId, milestone } },
    });
    if (existing) return null;

    const meta = MILESTONE_BADGE_META[milestone];

    await this.prisma.$transaction([
      this.prisma.userBadge.create({
        data: {
          userId,
          tenantId,
          milestone,
          coursesAt: coursesCompleted,
          metadata: { source: 'course_completion' },
        },
      }),
      this.prisma.gamificationEvent.create({
        data: {
          userId,
          tenantId,
          eventType: GamificationEventType.BADGE_EARNED,
          payload: { milestone, coursesCompleted },
        },
      }),
    ]);

    return {
      milestone,
      coursesCompleted,
      title: meta.title,
      message: meta.message,
      imageSrc: meta.imagePlaceholder,
      isUltimate: milestone === CourseMilestoneBadge.COURSES_12,
    };
  }

  private resolveMilestone(
    coursesCompleted: number,
  ): CourseMilestoneBadge | null {
    if (!COURSE_MILESTONE_THRESHOLDS.includes(coursesCompleted as 3 | 6 | 9 | 12)) {
      return null;
    }

    const map: Record<number, CourseMilestoneBadge> = {
      3: CourseMilestoneBadge.COURSES_3,
      6: CourseMilestoneBadge.COURSES_6,
      9: CourseMilestoneBadge.COURSES_9,
      12: CourseMilestoneBadge.COURSES_12,
    };

    return map[coursesCompleted] ?? null;
  }
}
