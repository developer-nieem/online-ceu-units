import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Announcement,
  AnnouncementAudience,
  EnrollmentStatus,
  LearnerNotificationType,
  Prisma,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@calace/db';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationEmitterService } from './notification-emitter.service';

@Injectable()
export class AdminMessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: NotificationEmitterService,
    private readonly delivery: NotificationDeliveryService,
    private readonly audit: AuditService,
  ) {}

  async createAnnouncement(
    actor: AuthUser,
    body: {
      title: string;
      message: string;
      audience: AnnouncementAudience;
      courseId?: string;
      publish?: boolean;
    },
  ): Promise<Announcement> {
    if (!body.title?.trim() || !body.message?.trim()) {
      throw new BadRequestException('Title and message are required');
    }

    if (body.audience === AnnouncementAudience.COHORT_PLACEHOLDER) {
      throw new BadRequestException(
        'Cohort messaging is reserved for a future release. Use ALL_LEARNERS or COURSE_ENROLLMENTS.',
      );
    }

    if (body.audience === AnnouncementAudience.COURSE_ENROLLMENTS && !body.courseId) {
      throw new BadRequestException('courseId is required for course-wide announcements');
    }

    const publishedAt = body.publish !== false ? new Date() : null;
    const announcement = await this.prisma.announcement.create({
      data: {
        tenantId: actor.tenantId,
        createdByUserId: actor.userId,
        title: body.title.trim(),
        body: body.message.trim(),
        audience: body.audience,
        courseId: body.courseId,
        publishedAt,
        metadata: { cohortMessagingPlaceholder: false } as Prisma.InputJsonValue,
      },
    });

    if (publishedAt) {
      await this.dispatchAnnouncement(actor.tenantId, announcement.id);
    }

    await this.audit.log({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: AuditAction.CREATE,
      entityType: 'announcement',
      entityId: announcement.id,
      metadata: { audience: body.audience, published: Boolean(publishedAt) },
    });

    return announcement;
  }

  async dispatchAnnouncement(tenantId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, tenantId },
      include: { course: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    let userIds: string[] = [];
    if (announcement.audience === AnnouncementAudience.ALL_LEARNERS) {
      const learners = await this.prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true },
        take: 500,
      });
      userIds = learners.map((u) => u.id);
    } else if (
      announcement.audience === AnnouncementAudience.COURSE_ENROLLMENTS &&
      announcement.courseId
    ) {
      const versions = await this.prisma.courseVersion.findMany({
        where: { courseId: announcement.courseId },
        select: { id: true },
      });
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          courseVersionId: { in: versions.map((v) => v.id) },
          status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
          deletedAt: null,
        },
        select: { userId: true },
        take: 500,
      });
      userIds = [...new Set(enrollments.map((e) => e.userId))];
    }

    for (const userId of userIds) {
      await this.emitter.emit(
        tenantId,
        userId,
        LearnerNotificationType.ADMIN_ANNOUNCEMENT,
        { announcementTitle: announcement.title },
        { skipCooldown: true },
      );
    }

    return { recipientCount: userIds.length };
  }

  async sendLearnerNotice(
    actor: AuthUser,
    body: { userId: string; title: string; message: string },
  ) {
    if (!body.userId || !body.title?.trim() || !body.message?.trim()) {
      throw new BadRequestException('userId, title, and message are required');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: body.userId, tenantId: actor.tenantId },
    });
    if (!target) throw new NotFoundException('Learner not found');

    await this.delivery.emitInApp({
      tenantId: actor.tenantId,
      userId: body.userId,
      type: LearnerNotificationType.LEARNER_NOTICE,
      title: body.title.trim(),
      body: body.message.trim(),
      actionHref: '/notifications',
    });

    await this.audit.log({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: AuditAction.CREATE,
      entityType: 'learner_notice',
      entityId: body.userId,
      metadata: { title: body.title },
    });

    return { success: true };
  }

  async sendCourseUpdate(
    actor: AuthUser,
    body: { courseId: string; title: string; message: string },
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: body.courseId, tenantId: actor.tenantId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const versions = await this.prisma.courseVersion.findMany({
      where: { courseId: course.id },
      select: { id: true },
    });
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseVersionId: { in: versions.map((v) => v.id) },
        deletedAt: null,
      },
      select: { userId: true },
      take: 500,
    });

    for (const e of enrollments) {
      await this.emitter.emit(
        actor.tenantId,
        e.userId,
        LearnerNotificationType.COURSE_UPDATE,
        { courseTitle: course.title, courseSlug: course.slug },
        { skipCooldown: true },
      );
    }

    return { recipientCount: enrollments.length };
  }

  async listAnnouncements(tenantId: string): Promise<Announcement[]> {
    return this.prisma.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
