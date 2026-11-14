import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { ReminderType } from '@calace/notifications-engine';
import {
  CompletionStatus,
  EnrollmentStatus,
  LearnerNotificationType,
  Prisma,
  ReminderStatus,
  RenewalPeriodStatus,
} from '@calace/db';

import { DEFAULT_TENANT_SLUG } from '../config/auth.constants';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@calace/db';
import { NotificationEmitterService } from './notification-emitter.service';
import { NotificationsService } from './notifications.service';

const REMINDER_TO_NOTIFICATION: Partial<Record<ReminderType, LearnerNotificationType>> = {
  UNFINISHED_COURSE: 'COURSE_REMINDER',
  INACTIVITY: 'INACTIVITY_REMINDER',
  INCOMPLETE_ATTESTATION: 'PARTICIPATION_WARNING',
  CERTIFICATE_READY: 'CERTIFICATE_ISSUED',
};

const RENEWAL_REMINDER_THRESHOLDS = [90, 60, 30] as const;
const BEHIND_PACE_DAYS_THRESHOLD = 30;
const BEHIND_PACE_MIN_HOURS = 12;

@Injectable()
export class ReminderEngineService {
  private readonly logger = new Logger(ReminderEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: NotificationEmitterService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  private async tenantId() {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not configured');
    return tenant.id;
  }

  async scheduleReminder(params: {
    tenantId: string;
    userId: string;
    reminderType: ReminderType;
    scheduledFor: Date;
    dedupeKey: string;
    payload?: Record<string, unknown>;
  }) {
    return this.prisma.scheduledReminder.upsert({
      where: {
        tenantId_userId_dedupeKey: {
          tenantId: params.tenantId,
          userId: params.userId,
          dedupeKey: params.dedupeKey,
        },
      },
      create: {
        tenantId: params.tenantId,
        userId: params.userId,
        reminderType: params.reminderType,
        scheduledFor: params.scheduledFor,
        dedupeKey: params.dedupeKey,
        payload: (params.payload ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        scheduledFor: params.scheduledFor,
        status: ReminderStatus.SCHEDULED,
        payload: (params.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async schedulePostEnrollmentReminders(
    tenantId: string,
    userId: string,
    enrollmentId: string,
    courseSlug: string,
  ) {
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.scheduleReminder({
      tenantId,
      userId,
      reminderType: 'UNFINISHED_COURSE',
      scheduledFor: inThreeDays,
      dedupeKey: `unfinished:${enrollmentId}`,
      payload: { enrollmentId, courseSlug },
    });
    await this.scheduleReminder({
      tenantId,
      userId,
      reminderType: 'INACTIVITY',
      scheduledFor: inSevenDays,
      dedupeKey: `inactivity:${enrollmentId}`,
      payload: { enrollmentId, courseSlug },
    });
  }

  async processDueReminders(limit = 50) {
    await this.scanAndScheduleRenewalReminders();
    await this.scanAndScheduleBehindPaceReminders();

    const tenantId = await this.tenantId();
    const now = new Date();
    const due = await this.prisma.scheduledReminder.findMany({
      where: {
        tenantId,
        status: ReminderStatus.SCHEDULED,
        scheduledFor: { lte: now },
      },
      take: limit,
      include: {
        user: { select: { id: true, firstName: true } },
      },
    });

    let sent = 0;
    for (const reminder of due) {
      const payload = (reminder.payload ?? {}) as {
        enrollmentId?: string;
        courseSlug?: string;
        courseTitle?: string;
        daysRemaining?: number;
        year?: number;
        hoursEarned?: number;
        hoursNeeded?: number;
      };

      if (reminder.reminderType === 'EXPIRATION_PLACEHOLDER') {
        const daysRemaining = payload.daysRemaining ?? 30;
        await this.notifications.notifyRenewalReminder(
          tenantId,
          reminder.userId,
          daysRemaining,
          reminder.user.firstName ?? undefined,
        );
        await this.prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SENT, processedAt: now },
        });
        sent += 1;
        continue;
      }

      if (reminder.reminderType === 'PARTICIPATION_WARNING') {
        await this.notifications
          .notifyBehindPace(
            tenantId,
            reminder.userId,
            (payload.year ?? 1) as 1 | 2,
            payload.hoursEarned ?? 0,
            payload.hoursNeeded ?? BEHIND_PACE_MIN_HOURS,
            reminder.user.firstName ?? undefined,
          )
          .catch(() => undefined);
        await this.prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SENT, processedAt: now },
        });
        sent += 1;
        continue;
      }

      let courseTitle = payload.courseTitle;
      if (payload.enrollmentId && !courseTitle) {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: { id: payload.enrollmentId },
          include: { courseVersion: { include: { course: true } } },
        });
        courseTitle = enrollment?.courseVersion.course.title;
        payload.courseSlug = enrollment?.courseVersion.course.slug;
      }

      const notifType = REMINDER_TO_NOTIFICATION[reminder.reminderType];
      if (!notifType) {
        await this.prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SKIPPED, processedAt: now },
        });
        continue;
      }

      if (reminder.reminderType === 'UNFINISHED_COURSE' && payload.enrollmentId) {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: { id: payload.enrollmentId },
        });
        if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
          await this.prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: { status: ReminderStatus.CANCELLED, processedAt: now },
          });
          continue;
        }
        const meta = (enrollment.metadata ?? {}) as { progressPct?: number };
        if ((meta.progressPct ?? 0) >= 100) {
          await this.prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: { status: ReminderStatus.CANCELLED, processedAt: now },
          });
          continue;
        }
      }

      const notification = await this.emitter.emit(
        tenantId,
        reminder.userId,
        notifType,
        {
          courseTitle,
          courseSlug: payload.courseSlug,
          daysInactive: reminder.reminderType === 'INACTIVITY' ? 7 : undefined,
        },
      );

      if (notification) {
        await this.prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.SENT,
            processedAt: now,
            notificationId: notification.id,
          },
        });
        sent += 1;
      }
    }

    await this.audit.log({
      tenantId,
      action: AuditAction.OTHER,
      entityType: 'reminder_engine',
      metadata: { processed: due.length, sent },
    });

    this.logger.log(`Processed ${due.length} reminders, sent ${sent}`);
    return { processed: due.length, sent };
  }

  @Cron('0 2 * * *')
  async runNightlyReminders(): Promise<void> {
    this.logger.log('Nightly reminder engine: starting');
    try {
      await this.processDueReminders(100);
      this.logger.log('Nightly reminder engine: complete');
    } catch (err) {
      this.logger.error('Nightly reminder engine failed', err);
    }
  }

  async scanAndScheduleAttestationReminders() {
    const tenantId = await this.tenantId();
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        tenantId,
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
      include: { courseVersion: { include: { course: true } } },
      take: 200,
    });

    let scheduled = 0;
    for (const e of enrollments) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const progressPct = (meta.progressPct as number) ?? 0;
      if (progressPct < 80) continue;
      if (meta.certificateAttestationAt) continue;

      await this.scheduleReminder({
        tenantId,
        userId: e.userId,
        reminderType: 'INCOMPLETE_ATTESTATION',
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        dedupeKey: `attestation:${e.id}`,
        payload: {
          enrollmentId: e.id,
          courseSlug: e.courseVersion.course.slug,
          courseTitle: e.courseVersion.course.title,
        },
      });
      scheduled += 1;
    }
    return { scheduled };
  }

  async scanAndScheduleRenewalReminders() {
    const tenantId = await this.tenantId();
    const now = new Date();
    const in90Days = new Date(now);
    in90Days.setUTCDate(in90Days.getUTCDate() + 90);

    const profiles = await this.prisma.learnerProfile.findMany({
      where: {
        tenantId,
        deletedAt: null,
        licenseExpiresOn: {
          not: null,
          gt: now,
          lte: in90Days,
        },
      },
      select: {
        userId: true,
        licenseExpiresOn: true,
      },
    });

    let scheduled = 0;
    for (const profile of profiles) {
      const expiresOn = profile.licenseExpiresOn!;
      const expiresKey = expiresOn.toISOString().slice(0, 10);

      for (const days of RENEWAL_REMINDER_THRESHOLDS) {
        const scheduledFor = new Date(expiresOn);
        scheduledFor.setUTCDate(scheduledFor.getUTCDate() - days);
        const dedupeKey = `renewal:${expiresKey}:${days}`;

        const existing = await this.prisma.scheduledReminder.findUnique({
          where: {
            tenantId_userId_dedupeKey: {
              tenantId,
              userId: profile.userId,
              dedupeKey,
            },
          },
        });
        if (existing) continue;

        await this.scheduleReminder({
          tenantId,
          userId: profile.userId,
          reminderType: 'EXPIRATION_PLACEHOLDER',
          scheduledFor,
          dedupeKey,
          payload: {
            daysRemaining: days,
            licenseExpiresOn: expiresKey,
          },
        });
        scheduled += 1;
      }
    }

    this.logger.log(`Scheduled ${scheduled} renewal reminders for ${profiles.length} profiles`);
    return { scheduled, profiles: profiles.length };
  }

  private subtractOneYear(date: Date): Date {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  async scanAndScheduleBehindPaceReminders() {
    const tenantId = await this.tenantId();
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);

    const renewalPeriods = await this.prisma.renewalPeriod.findMany({
      where: {
        status: RenewalPeriodStatus.ACTIVE,
        user: { tenantId, deletedAt: null },
      },
      select: {
        id: true,
        userId: true,
        periodStart: true,
        periodEnd: true,
        metadata: true,
      },
    });

    let scheduled = 0;
    for (const period of renewalPeriods) {
      const periodMetadata = period.metadata as { year1End?: string } | null;
      const year1End = periodMetadata?.year1End
        ? new Date(periodMetadata.year1End)
        : this.subtractOneYear(period.periodEnd);

      const completions = await this.prisma.completion.findMany({
        where: {
          userId: period.userId,
          completedAt: { gte: period.periodStart, lte: period.periodEnd },
          status: CompletionStatus.APPROVED,
        },
        select: { completedAt: true, ceHoursEarned: true },
      });

      const year1Hours = completions
        .filter((c) => c.completedAt <= year1End)
        .reduce((sum, c) => sum + Number(c.ceHoursEarned), 0);
      const year2Hours = completions
        .filter((c) => c.completedAt > year1End)
        .reduce((sum, c) => sum + Number(c.ceHoursEarned), 0);

      const year1Open = now <= year1End;
      const year1DaysLeft = (year1End.getTime() - now.getTime()) / 86400000;
      const needsYear1Nudge =
        year1Open &&
        year1DaysLeft > BEHIND_PACE_DAYS_THRESHOLD &&
        year1Hours < BEHIND_PACE_MIN_HOURS;

      const year2Open = now > year1End && now <= period.periodEnd;
      const year2DaysLeft = (period.periodEnd.getTime() - now.getTime()) / 86400000;
      const needsYear2Nudge =
        year2Open &&
        year2DaysLeft > BEHIND_PACE_DAYS_THRESHOLD &&
        year2Hours < BEHIND_PACE_MIN_HOURS;

      if (needsYear1Nudge) {
        await this.scheduleReminder({
          tenantId,
          userId: period.userId,
          reminderType: 'PARTICIPATION_WARNING',
          scheduledFor: now,
          dedupeKey: `pace:y1:${period.userId}:${monthKey}`,
          payload: {
            year: 1,
            hoursEarned: year1Hours,
            hoursNeeded: BEHIND_PACE_MIN_HOURS - year1Hours,
          },
        });
        scheduled += 1;
      }

      if (needsYear2Nudge) {
        await this.scheduleReminder({
          tenantId,
          userId: period.userId,
          reminderType: 'PARTICIPATION_WARNING',
          scheduledFor: now,
          dedupeKey: `pace:y2:${period.userId}:${monthKey}`,
          payload: {
            year: 2,
            hoursEarned: year2Hours,
            hoursNeeded: BEHIND_PACE_MIN_HOURS - year2Hours,
          },
        });
        scheduled += 1;
      }
    }

    this.logger.log(
      `Scanned ${renewalPeriods.length} learners for behind-pace; scheduled ${scheduled} nudges`,
    );
    return { scheduled, scanned: renewalPeriods.length };
  }
}
