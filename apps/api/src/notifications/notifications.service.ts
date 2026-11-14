import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationChannel, NotificationStatus, Prisma } from '@calace/db';

import { resolveSmtpFrom } from '../email/email-delivery.config';
import { EmailDeliveryService } from '../email/email-delivery.service';
import {
  buildBehindPaceEmail,
  buildCertificateReadyEmail,
  buildCeuCompletionPlaceholderEmail,
  buildEnrollmentConfirmedEmail,
  buildPaymentReceivedEmail,
  buildExamResultEmail,
  buildPasswordResetEmail,
  buildReferralConvertedEmail,
  buildReferralUsedEmail,
  buildRenewalReminderEmail,
  buildVerificationEmail,
  buildWelcomeEmail,
  type EmailFooterLinks,
} from '../email/templates/transactional-email.templates';
import { PrismaService } from '../prisma/prisma.service';
import { UnsubscribeService } from './unsubscribe.service';
import { UNSUBSCRIBE_SCOPE } from './unsubscribe-token.util';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  NOTIFICATION_PREFERENCES_METADATA_KEY,
  parseNotificationPreferences,
  SUPPORT_EMAIL_PLACEHOLDER,
  type NotificationPreferencesV1,
} from './notification-preferences.types';

export const AUTH_EMAIL_FROM = `Online CE Units - CAL ACE <${SUPPORT_EMAIL_PLACEHOLDER}>`;

export type AuthEmailTemplate =
  | 'welcome'
  | 'email_verification'
  | 'password_reset'
  | 'ceu_completion'
  | 'certificate_ready'
  | 'enrollment_confirmed'
  | 'payment_received'
  | 'exam_result'
  | 'referral_used'
  | 'referral_converted'
  | 'renewal_reminder'
  | 'behind_pace';

export type NotificationPreferenceKey =
  | 'emailEnabled'
  | 'certificateNotificationsEnabled'
  | 'courseRemindersEnabled'
  | 'marketingEmailsEnabled';

export type LearnerInboxNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDelivery: EmailDeliveryService,
    private readonly config: ConfigService,
    private readonly unsubscribe: UnsubscribeService,
  ) {}

  private webBaseUrl(): string {
    return (this.config.get<string>('WEB_URL') ?? 'https://onlineceunits.com').replace(/\/$/, '');
  }

  private managePrefsUrl(): string {
    return `${this.webBaseUrl()}/account`;
  }

  private payloadArchivedAt(payload: Prisma.JsonValue): string | null {
    const meta = (payload ?? {}) as Record<string, unknown>;
    return typeof meta.archivedAt === 'string' ? meta.archivedAt : null;
  }

  private toInboxDto(row: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    payload: Prisma.JsonValue;
  }): LearnerInboxNotification {
    return {
      id: row.id,
      title: row.title,
      message: row.body,
      createdAt: row.createdAt.toISOString(),
      readAt: row.readAt?.toISOString() ?? null,
      archivedAt: this.payloadArchivedAt(row.payload),
    };
  }

  private async findOwnedInAppNotification(
    tenantId: string,
    userId: string,
    notificationId: string,
  ) {
    const row = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        tenantId,
        userId,
        channel: NotificationChannel.IN_APP,
      },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    return row;
  }

  async createInAppNotification(params: {
    tenantId: string;
    userId: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }): Promise<Notification> {
    const now = new Date();
    return this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        title: params.title,
        body: params.body,
        payload: (params.payload ?? {}) as Prisma.InputJsonValue,
        sentAt: now,
      },
    });
  }

  async notifyEnrollmentConfirmed(
    tenantId: string,
    userId: string,
    courseTitle: string,
    courseSlug: string,
  ): Promise<Notification> {
    return this.createInAppNotification({
      tenantId,
      userId,
      title: 'Enrollment confirmed',
      body: `You are enrolled in ${courseTitle}.`,
      payload: { event: 'enrollment_confirmed', courseSlug, courseTitle },
    });
  }

  async notifyPaymentReceived(
    tenantId: string,
    userId: string,
    amountLabel: string,
    planLabel: string,
  ): Promise<Notification> {
    return this.createInAppNotification({
      tenantId,
      userId,
      title: 'Payment received',
      body: `Your Stripe payment of ${amountLabel} for ${planLabel} is complete.`,
      payload: { event: 'payment_received', amountLabel, planLabel },
    });
  }

  async notifyFinalExamResult(
    tenantId: string,
    userId: string,
    courseTitle: string,
    courseSlug: string,
    passed: boolean,
    attemptId: string,
  ): Promise<Notification> {
    if (passed) {
      return this.createInAppNotification({
        tenantId,
        userId,
        title: 'Final exam passed',
        body: `You passed the final exam for ${courseTitle}.`,
        payload: { event: 'final_exam_passed', courseSlug, courseTitle, attemptId },
      });
    }
    return this.createInAppNotification({
      tenantId,
      userId,
      title: 'Final exam attempt submitted',
      body: `Your final exam attempt for ${courseTitle} has been submitted.`,
      payload: { event: 'final_exam_failed', courseSlug, courseTitle, attemptId },
    });
  }

  async notifyCertificateReady(
    tenantId: string,
    userId: string,
    courseTitle: string,
    certificateId: string,
  ): Promise<Notification> {
    return this.createInAppNotification({
      tenantId,
      userId,
      title: 'Certificate ready',
      body: `Your certificate for ${courseTitle} is ready.`,
      payload: { event: 'certificate_ready', courseTitle, certificateId },
    });
  }

  private async getPreferences(
    tenantId: string,
    userId: string,
  ): Promise<NotificationPreferencesV1> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { metadata: true },
    });
    if (!user) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
    return parseNotificationPreferences(user.metadata);
  }

  async sendAuthEmail(
    params: {
      tenantId: string;
      userId: string;
      to: string;
      template: AuthEmailTemplate;
      subject: string;
      text: string;
      html: string;
      payload?: Record<string, unknown>;
      headers?: Record<string, string>;
    },
    options?: {
      respectPreferences?: boolean;
      preferenceKeys?: NotificationPreferenceKey[];
    },
  ): Promise<Notification> {
    const respectPreferences = options?.respectPreferences ?? false;

    if (respectPreferences) {
      const prefs = await this.getPreferences(params.tenantId, params.userId);

      if (prefs.emailEnabled === false) {
        this.logger.log(
          `[notifications] Skipping ${params.template} — emailEnabled preference is off (to=${params.to})`,
        );
        return this.prisma.notification.create({
          data: {
            tenantId: params.tenantId,
            userId: params.userId,
            channel: NotificationChannel.EMAIL,
            status: NotificationStatus.PENDING,
            title: params.subject,
            body: params.text,
            payload: {
              template: params.template,
              to: params.to,
              skippedDueToPreferences: true,
              skippedPreferenceKey: 'emailEnabled',
              ...params.payload,
            },
          },
        });
      }

      for (const key of options?.preferenceKeys ?? []) {
        if (prefs[key] === false) {
          this.logger.log(
            `[notifications] Skipping ${params.template} — ${key} preference is off (to=${params.to})`,
          );
          return this.prisma.notification.create({
            data: {
              tenantId: params.tenantId,
              userId: params.userId,
              channel: NotificationChannel.EMAIL,
              status: NotificationStatus.PENDING,
              title: params.subject,
              body: params.text,
              payload: {
                template: params.template,
                to: params.to,
                skippedDueToPreferences: true,
                skippedPreferenceKey: key,
                ...params.payload,
              },
            },
          });
        }
      }
    }

    const from = resolveSmtpFrom(this.config);
    this.logger.log(
      `[notifications] sendAuthEmail template=${params.template} → EmailDeliveryService (to=${params.to})`,
    );
    let delivery;
    try {
      delivery = await this.emailDelivery.sendTransactionalEmail({
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        kind: params.template,
        replyTo: SUPPORT_EMAIL_PLACEHOLDER,
        headers: params.headers,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[email] Unexpected delivery error for ${params.template}: ${message}`);
      delivery = {
        delivered: false,
        mode: 'development',
        smtpConfigured: this.emailDelivery.smtpEnabled(),
        error: message,
      };
    }

    const status = delivery.delivered
      ? NotificationStatus.SENT
      : delivery.smtpConfigured
        ? NotificationStatus.FAILED
        : NotificationStatus.PENDING;
    const now = delivery.delivered ? new Date() : undefined;

    if (delivery.delivered) {
      this.logger.log(
        `[notifications] ${params.template} recorded as SENT (mode=${delivery.mode})`,
      );
    } else if (delivery.smtpConfigured) {
      this.logger.error(
        `[notifications] ${params.template} recorded as FAILED (mode=${delivery.mode} error=${delivery.error ?? 'unknown'})`,
      );
    } else {
      this.logger.warn(
        `[notifications] ${params.template} recorded as PENDING — development fallback, not sent via SMTP`,
      );
    }

    return this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        channel: NotificationChannel.EMAIL,
        status,
        title: params.subject,
        body: params.text,
        sentAt: now,
        payload: {
          template: params.template,
          from,
          to: params.to,
          deliveryMode: delivery.mode,
          messageId: delivery.messageId,
          deliveryError: delivery.error,
          deliveryErrorCategory: delivery.errorCategory,
          placeholder: !delivery.delivered && !delivery.smtpConfigured,
          ...params.payload,
        },
      },
    });
  }

  async sendWelcomeEmail(
    tenantId: string,
    userId: string,
    email: string,
    firstName?: string,
  ): Promise<Notification> {
    const content = buildWelcomeEmail({ firstName });
    return this.sendAuthEmail({
      tenantId,
      userId,
      to: email,
      template: 'welcome',
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  }

  async sendVerificationEmail(
    tenantId: string,
    userId: string,
    email: string,
    verifyUrl: string,
    firstName?: string,
  ): Promise<Notification> {
    this.logger.log(
      `[notifications] sendVerificationEmail called (userId=${userId} to=${email})`,
    );
    const content = buildVerificationEmail({ verifyUrl, firstName });
    return this.sendAuthEmail({
      tenantId,
      userId,
      to: email,
      template: 'email_verification',
      subject: content.subject,
      text: content.text,
      html: content.html,
      payload: { verifyUrl, replyTo: SUPPORT_EMAIL_PLACEHOLDER },
    });
  }

  async sendPasswordResetEmail(
    tenantId: string,
    userId: string,
    email: string,
    resetUrl: string,
    firstName?: string,
  ): Promise<Notification> {
    const content = buildPasswordResetEmail({ resetUrl, firstName });
    return this.sendAuthEmail({
      tenantId,
      userId,
      to: email,
      template: 'password_reset',
      subject: content.subject,
      text: content.text,
      html: content.html,
      payload: { resetUrl },
    });
  }

  async getNotificationPreferences(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { metadata: true, updatedAt: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      preferences: parseNotificationPreferences(user.metadata),
      defaults: DEFAULT_NOTIFICATION_PREFERENCES,
      supportEmail: SUPPORT_EMAIL_PLACEHOLDER,
      storage: 'user.metadata.notificationPreferences' as const,
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateNotificationPreferences(
    tenantId: string,
    userId: string,
    patch: Partial<NotificationPreferencesV1>,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { metadata: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const meta = (user.metadata ?? {}) as Record<string, unknown>;
    const current = parseNotificationPreferences(meta);
    const preferences = mergeNotificationPreferences(current, patch);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...meta,
          [NOTIFICATION_PREFERENCES_METADATA_KEY]: preferences,
        } as Prisma.InputJsonValue,
      },
      select: { metadata: true, updatedAt: true },
    });

    return {
      preferences: parseNotificationPreferences(updated.metadata),
      supportEmail: SUPPORT_EMAIL_PLACEHOLDER,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getInAppNotifications(
    tenantId: string,
    userId: string,
  ): Promise<LearnerInboxNotification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        tenantId,
        userId,
        channel: NotificationChannel.IN_APP,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        readAt: true,
        payload: true,
      },
    });

    return rows
      .filter((row) => !this.payloadArchivedAt(row.payload))
      .map((row) => this.toInboxDto(row));
  }

  async getUnreadInAppCount(tenantId: string, userId: string): Promise<number> {
    const rows = await this.prisma.notification.findMany({
      where: {
        tenantId,
        userId,
        channel: NotificationChannel.IN_APP,
        readAt: null,
        status: {
          in: [
            NotificationStatus.DELIVERED,
            NotificationStatus.SENT,
            NotificationStatus.PENDING,
          ],
        },
      },
      select: { payload: true },
    });

    return rows.filter((row) => !this.payloadArchivedAt(row.payload)).length;
  }

  async markInAppAsRead(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<LearnerInboxNotification> {
    await this.findOwnedInAppNotification(tenantId, userId, notificationId);
    const now = new Date();
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: now,
        status: NotificationStatus.READ,
      },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        readAt: true,
        payload: true,
      },
    });
    return this.toInboxDto(updated);
  }

  async archiveInApp(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<LearnerInboxNotification> {
    const row = await this.findOwnedInAppNotification(tenantId, userId, notificationId);
    const now = new Date();
    const payload = {
      ...((row.payload ?? {}) as Record<string, unknown>),
      archivedAt: now.toISOString(),
    };

    const data: Prisma.NotificationUpdateInput = {
      payload: payload as Prisma.InputJsonValue,
      readAt: row.readAt ?? now,
      status: NotificationStatus.READ,
    };

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        readAt: true,
        payload: true,
      },
    });

    return this.toInboxDto(updated);
  }

  async sendEnrollmentConfirmedEmail(params: {
    tenantId: string;
    userId: string;
    to: string;
    firstName?: string;
    courseTitle: string;
    courseUrl: string;
  }): Promise<Notification> {
    const content = buildEnrollmentConfirmedEmail({
      firstName: params.firstName,
      courseTitle: params.courseTitle,
      courseUrl: params.courseUrl,
    });
    return this.sendAuthEmail(
      {
        tenantId: params.tenantId,
        userId: params.userId,
        to: params.to,
        template: 'enrollment_confirmed',
        subject: content.subject,
        text: content.text,
        html: content.html,
        payload: { courseTitle: params.courseTitle },
      },
      {
        respectPreferences: true,
        preferenceKeys: ['emailEnabled', 'courseRemindersEnabled'],
      },
    );
  }

  async sendPaymentReceivedEmail(params: {
    tenantId: string;
    userId: string;
    to: string;
    firstName?: string;
    amountUsd: number;
    plan: string;
    orderNumber: string;
    courseTitle?: string;
    actionUrl: string;
  }): Promise<Notification> {
    const content = buildPaymentReceivedEmail({
      firstName: params.firstName,
      amountUsd: params.amountUsd,
      plan: params.plan,
      orderNumber: params.orderNumber,
      courseTitle: params.courseTitle,
      actionUrl: params.actionUrl,
    });
    return this.sendAuthEmail({
      tenantId: params.tenantId,
      userId: params.userId,
      to: params.to,
      template: 'payment_received',
      subject: content.subject,
      text: content.text,
      html: content.html,
      payload: {
        orderNumber: params.orderNumber,
        plan: params.plan,
        amountUsd: params.amountUsd,
      },
    });
  }

  async sendFinalExamResultEmail(params: {
    tenantId: string;
    userId: string;
    to: string;
    firstName?: string;
    courseTitle: string;
    passed: boolean;
    scorePct?: number;
    courseUrl: string;
  }): Promise<Notification> {
    const content = buildExamResultEmail({
      firstName: params.firstName,
      courseTitle: params.courseTitle,
      passed: params.passed,
      scorePct: params.scorePct,
      courseUrl: params.courseUrl,
    });
    return this.sendAuthEmail(
      {
        tenantId: params.tenantId,
        userId: params.userId,
        to: params.to,
        template: 'exam_result',
        subject: content.subject,
        text: content.text,
        html: content.html,
        payload: { courseTitle: params.courseTitle, passed: params.passed },
      },
      {
        respectPreferences: true,
        preferenceKeys: ['emailEnabled', 'courseRemindersEnabled'],
      },
    );
  }

  async sendCertificateReadyEmail(params: {
    tenantId: string;
    userId: string;
    to: string;
    firstName?: string;
    courseTitle: string;
    certificateNo: string;
    ceuHours: number;
    verifyUrl: string;
  }): Promise<Notification> {
    const content = buildCertificateReadyEmail({
      firstName: params.firstName,
      courseTitle: params.courseTitle,
      certificateNo: params.certificateNo,
      ceuHours: params.ceuHours,
      verifyUrl: params.verifyUrl,
    });
    return this.sendAuthEmail(
      {
        tenantId: params.tenantId,
        userId: params.userId,
        to: params.to,
        template: 'certificate_ready',
        subject: content.subject,
        text: content.text,
        html: content.html,
        payload: {
          courseTitle: params.courseTitle,
          certificateNo: params.certificateNo,
          verifyUrl: params.verifyUrl,
        },
      },
      {
        respectPreferences: true,
        preferenceKeys: ['emailEnabled', 'certificateNotificationsEnabled'],
      },
    );
  }

  async sendCeuCompletionPlaceholder(
    tenantId: string,
    userId: string,
    email: string,
    courseTitle: string,
    firstName?: string,
  ): Promise<Notification> {
    const content = buildCeuCompletionPlaceholderEmail({ courseTitle, firstName });
    return this.sendAuthEmail({
      tenantId,
      userId,
      to: email,
      template: 'ceu_completion',
      subject: content.subject,
      text: content.text,
      html: content.html,
      payload: { courseTitle },
    });
  }

  async notifyReferralUsed(
    tenantId: string,
    referrerId: string,
    firstName?: string,
  ): Promise<void> {
    await this.createInAppNotification({
      tenantId,
      userId: referrerId,
      title: '🎉 Someone just used your referral code!',
      body: 'Your referral is currently Pending. You\'ll receive your reward after your friend completes their first qualifying purchase.',
      payload: { event: 'referral_used' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: referrerId },
      select: { email: true },
    });
    if (user?.email) {
      const links = this.promotionalLinks(tenantId, referrerId, UNSUBSCRIBE_SCOPE.MARKETING);
      const content = buildReferralUsedEmail({ firstName, links });
      await this.sendAuthEmail(
        {
          tenantId,
          userId: referrerId,
          to: user.email,
          template: 'referral_used',
          subject: content.subject,
          text: content.text,
          html: content.html,
          headers: this.unsubscribe.headersFor(tenantId, referrerId, UNSUBSCRIBE_SCOPE.MARKETING),
          payload: { event: 'referral_used' },
        },
        { respectPreferences: true, preferenceKeys: ['emailEnabled', 'marketingEmailsEnabled'] },
      );
    }
  }

  /** Build the footer links (confirmation-page unsubscribe + manage prefs). */
  private promotionalLinks(
    tenantId: string,
    userId: string,
    scope: (typeof UNSUBSCRIBE_SCOPE)[keyof typeof UNSUBSCRIBE_SCOPE],
  ): EmailFooterLinks {
    return {
      unsubscribeUrl: this.unsubscribe.linkFor(tenantId, userId, scope),
      managePrefsUrl: this.managePrefsUrl(),
    };
  }

  async notifyReferralConverted(
    tenantId: string,
    referrerId: string,
    firstName?: string,
  ): Promise<void> {
    await this.createInAppNotification({
      tenantId,
      userId: referrerId,
      title: '🎉 Your referral completed their first purchase!',
      body: 'Congratulations — your referral reward credit has been added to your account.',
      payload: { event: 'referral_converted' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: referrerId },
      select: { email: true },
    });
    if (user?.email) {
      const links = this.promotionalLinks(tenantId, referrerId, UNSUBSCRIBE_SCOPE.MARKETING);
      const content = buildReferralConvertedEmail({ firstName, links });
      await this.sendAuthEmail(
        {
          tenantId,
          userId: referrerId,
          to: user.email,
          template: 'referral_converted',
          subject: content.subject,
          text: content.text,
          html: content.html,
          headers: this.unsubscribe.headersFor(tenantId, referrerId, UNSUBSCRIBE_SCOPE.MARKETING),
          payload: { event: 'referral_converted' },
        },
        { respectPreferences: true, preferenceKeys: ['emailEnabled', 'marketingEmailsEnabled'] },
      );
    }
  }

  async notifyBehindPace(
    tenantId: string,
    userId: string,
    year: 1 | 2,
    hoursEarned: number,
    hoursNeeded: number,
    firstName?: string,
  ): Promise<void> {
    const gap = hoursNeeded;

    await this.createInAppNotification({
      tenantId,
      userId,
      title: `📉 Year ${year} is running short on CEU hours`,
      body:
        `You have ${hoursEarned} of 12 required hours in Year ${year}. ` +
        `You still need ${gap} more hour${gap !== 1 ? 's' : ''} — ` +
        `complete courses now while there is still time.`,
      payload: { event: 'behind_pace', year, hoursEarned, hoursNeeded },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      const webUrl = this.webBaseUrl();
      const links = this.promotionalLinks(tenantId, userId, UNSUBSCRIBE_SCOPE.COURSE_REMINDERS);
      const content = buildBehindPaceEmail({
        firstName,
        year,
        hoursEarned,
        hoursNeeded: gap,
        coursesUrl: `${webUrl}/courses`,
        links,
      });
      await this.sendAuthEmail(
        {
          tenantId,
          userId,
          to: user.email,
          template: 'behind_pace' as AuthEmailTemplate,
          subject: content.subject,
          text: content.text,
          html: content.html,
          headers: this.unsubscribe.headersFor(
            tenantId,
            userId,
            UNSUBSCRIBE_SCOPE.COURSE_REMINDERS,
          ),
          payload: { event: 'behind_pace', year, hoursEarned, hoursNeeded },
        },
        { respectPreferences: true, preferenceKeys: ['emailEnabled', 'courseRemindersEnabled'] },
      );
    }
  }

  async notifyRenewalReminder(
    tenantId: string,
    userId: string,
    daysRemaining: number,
    firstName?: string,
  ): Promise<void> {
    await this.createInAppNotification({
      tenantId,
      userId,
      title: `⏰ ${daysRemaining} days until your CNA certification expires`,
      body:
        'Start your renewal CEUs now to avoid a lapse in certification. ' +
        'You need 48 total hours (at least 12 per year, max 24 online). ' +
        'Visit your compliance page to track progress.',
      payload: { event: 'renewal_reminder', daysRemaining },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      const webUrl = this.webBaseUrl();
      const links = this.promotionalLinks(tenantId, userId, UNSUBSCRIBE_SCOPE.COURSE_REMINDERS);
      const content = buildRenewalReminderEmail({
        firstName,
        daysRemaining,
        complianceUrl: `${webUrl}/compliance`,
        links,
      });
      await this.sendAuthEmail(
        {
          tenantId,
          userId,
          to: user.email,
          template: 'renewal_reminder',
          subject: content.subject,
          text: content.text,
          html: content.html,
          headers: this.unsubscribe.headersFor(
            tenantId,
            userId,
            UNSUBSCRIBE_SCOPE.COURSE_REMINDERS,
          ),
          payload: { event: 'renewal_reminder', daysRemaining },
        },
        { respectPreferences: true, preferenceKeys: ['emailEnabled', 'courseRemindersEnabled'] },
      );
    }
  }
}
