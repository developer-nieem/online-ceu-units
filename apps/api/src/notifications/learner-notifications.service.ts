import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  completionNudgeCopy,
} from '@calace/notifications-engine';
import {
  EnrollmentStatus,
  LearnerNotificationType,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearnerNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: {
    id: string;
    title: string;
    body: string;
    category: NotificationCategory | null;
    notificationType: LearnerNotificationType | null;
    actionHref: string | null;
    readAt: Date | null;
    archivedAt: Date | null;
    createdAt: Date;
    payload: Prisma.JsonValue;
  }) {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      category: row.category,
      type: row.notificationType,
      actionHref: row.actionHref,
      read: Boolean(row.readAt),
      archived: Boolean(row.archivedAt),
      createdAt: row.createdAt.toISOString(),
      readAt: row.readAt?.toISOString() ?? null,
      courseSlug: payload.courseSlug as string | undefined,
      courseTitle: payload.courseTitle as string | undefined,
    };
  }

  async listInbox(user: AuthUser, options?: { includeArchived?: boolean }) {
    const rows = await this.prisma.notification.findMany({
      where: {
        userId: user.userId,
        tenantId: user.tenantId,
        channel: NotificationChannel.IN_APP,
        archivedAt: options?.includeArchived ? undefined : null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => this.mapRow(r));
  }

  async unreadCount(user: AuthUser) {
    return this.prisma.notification.count({
      where: {
        userId: user.userId,
        tenantId: user.tenantId,
        channel: NotificationChannel.IN_APP,
        archivedAt: null,
        readAt: null,
        status: { in: [NotificationStatus.DELIVERED, NotificationStatus.SENT] },
      },
    });
  }

  async markRead(user: AuthUser, notificationId: string) {
    const row = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.userId,
        channel: NotificationChannel.IN_APP,
      },
    });
    if (!row) throw new NotFoundException('Notification not found');

    const now = new Date();
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const analytics = (payload.analytics ?? {}) as Record<string, unknown>;

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: now,
        status: NotificationStatus.READ,
        payload: {
          ...payload,
          analytics: {
            ...analytics,
            readAt: now.toISOString(),
            openedAt: now.toISOString(),
          },
        } as Prisma.InputJsonValue,
      },
    });
    return this.mapRow(updated);
  }

  async markAllRead(user: AuthUser) {
    const now = new Date();
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: user.userId,
        tenantId: user.tenantId,
        channel: NotificationChannel.IN_APP,
        archivedAt: null,
        readAt: null,
      },
      data: { readAt: now, status: NotificationStatus.READ },
    });
    return { updated: result.count };
  }

  async archive(user: AuthUser, notificationId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId: user.userId },
    });
    if (!row) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { archivedAt: new Date() },
    });
    return this.mapRow(updated);
  }

  async getPreferences(user: AuthUser) {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { userId: user.userId },
    });
    return {
      preferences: row?.preferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
      placeholder: !row,
      note: 'Preference persistence is active; channel providers (SMS/push) are placeholders.',
    };
  }

  async updatePreferences(user: AuthUser, preferences: Record<string, unknown>) {
    const row = await this.prisma.notificationPreference.upsert({
      where: { userId: user.userId },
      create: {
        tenantId: user.tenantId,
        userId: user.userId,
        preferences: preferences as Prisma.InputJsonValue,
      },
      update: { preferences: preferences as Prisma.InputJsonValue },
    });
    return { preferences: row.preferences };
  }

  async continueLearning(user: AuthUser) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        courseVersion: { include: { course: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });

    return enrollments.map((e) => {
      const meta = (e.metadata ?? {}) as { progressPct?: number; lastLessonSlug?: string };
      const progressPct = meta.progressPct ?? 0;
      const course = e.courseVersion.course;
      return {
        enrollmentId: e.id,
        courseSlug: course.slug,
        courseTitle: course.title,
        progressPct,
        resumeHref: `/courses/${course.slug}/learn`,
        nudge: completionNudgeCopy(progressPct, course.title),
      };
    });
  }
}
