import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_COOLDOWN_HOURS,
  notificationCopy,
  type NotificationCopyInput,
} from '@calace/notifications-engine';
import { AuditAction, LearnerNotificationType, Notification, Prisma } from '@calace/db';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationDeliveryService } from './notification-delivery.service';

@Injectable()
export class NotificationEmitterService {
  constructor(
    private readonly delivery: NotificationDeliveryService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async emit(
    tenantId: string,
    userId: string,
    type: LearnerNotificationType,
    input: NotificationCopyInput = {},
    options?: { alsoEmail?: boolean; skipCooldown?: boolean },
  ): Promise<Notification | null> {
    const cooldown = NOTIFICATION_COOLDOWN_HOURS[type as keyof typeof NOTIFICATION_COOLDOWN_HOURS];
    if (cooldown && !options?.skipCooldown) {
      const throttled = await this.delivery.shouldThrottle(tenantId, userId, type, cooldown);
      if (throttled) return null;
    }

    const copy = notificationCopy(type, input);
    let email: string | undefined;
    if (options?.alsoEmail) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      email = user?.email;
    }

    const notification = await this.delivery.emitInApp({
      tenantId,
      userId,
      type,
      title: copy.title,
      body: copy.body,
      actionHref: copy.actionHref,
      alsoEmail: options?.alsoEmail,
      email,
      payloadExtra: {
        courseSlug: input.courseSlug,
        courseTitle: input.courseTitle,
        certificateNo: input.certificateNo,
      },
    });

    await this.audit.log({
      tenantId,
      actorId: userId,
      action: AuditAction.CREATE,
      entityType: 'notification',
      entityId: notification.id,
      metadata: { notificationType: type, channel: 'IN_APP' },
    });

    return notification;
  }

  async emitEnrollmentConfirmation(
    tenantId: string,
    userId: string,
    courseTitle: string,
    courseSlug: string,
  ): Promise<Notification | null> {
    return this.emit(tenantId, userId, 'ENROLLMENT_CONFIRMATION', {
      courseTitle,
      courseSlug,
    });
  }

  async emitExamResult(
    tenantId: string,
    userId: string,
    courseTitle: string,
    courseSlug: string,
    passed: boolean,
    scorePct: number,
  ): Promise<Notification | null> {
    return this.emit(tenantId, userId, 'EXAM_RESULT', {
      courseTitle,
      courseSlug,
      passed,
      scorePct,
    });
  }

  async emitExamUnlockOnce(
    tenantId: string,
    userId: string,
    enrollmentId: string,
    courseTitle: string,
    courseSlug: string,
  ): Promise<Notification | null> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { metadata: true },
    });
    const meta = (enrollment?.metadata ?? {}) as Record<string, unknown>;
    if (meta.examUnlockNotifiedAt) return null;

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        metadata: {
          ...meta,
          examUnlockNotifiedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return this.emit(tenantId, userId, 'EXAM_UNLOCK', { courseTitle, courseSlug });
  }

  async emitCertificateIssued(
    tenantId: string,
    userId: string,
    courseTitle: string,
    certificateNo: string,
  ): Promise<Notification | null> {
    return this.emit(tenantId, userId, 'CERTIFICATE_ISSUED', {
      courseTitle,
      certificateNo,
    });
  }

  async emitTranscriptUpdate(
    tenantId: string,
    userId: string,
    courseTitle: string,
  ): Promise<Notification | null> {
    return this.emit(tenantId, userId, 'TRANSCRIPT_UPDATE', { courseTitle });
  }

  async emitParticipationWarning(
    tenantId: string,
    userId: string,
    courseTitle: string,
    courseSlug: string,
  ): Promise<Notification | null> {
    return this.emit(tenantId, userId, 'PARTICIPATION_WARNING', { courseTitle, courseSlug });
  }

  async emitCmsPublish(
    tenantId: string,
    userIds: string[],
    courseTitle: string,
    courseSlug: string,
  ) {
    const limited = userIds.slice(0, 100);
    for (const userId of limited) {
      await this.emit(tenantId, userId, 'CMS_PUBLISH', { courseTitle, courseSlug });
    }
  }
}
