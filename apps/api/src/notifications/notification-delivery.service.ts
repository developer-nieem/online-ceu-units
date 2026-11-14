import { Injectable, Logger } from '@nestjs/common';
import {
  buildNotificationPayload,
  createDefaultAdapters,
  type DeliveryChannel,
  type DeliveryRecord,
  type DeliveryRequest,
} from '@calace/notifications-engine';
import {
  LearnerNotificationType,
  Notification,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@calace/db';

import { PrismaService } from '../prisma/prisma.service';
import { TYPE_TO_CATEGORY } from './notification.constants';

export type EmitInAppParams = {
  tenantId: string;
  userId: string;
  type: LearnerNotificationType;
  title: string;
  body: string;
  actionHref?: string;
  category?: NotificationCategory;
  alsoEmail?: boolean;
  email?: string;
  payloadExtra?: Record<string, unknown>;
};

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);
  private readonly adapters = createDefaultAdapters();

  constructor(private readonly prisma: PrismaService) {}

  async emitInApp(params: EmitInAppParams): Promise<Notification> {
    const category = params.category ?? TYPE_TO_CATEGORY[params.type];
    const channels: DeliveryChannel[] = params.alsoEmail
      ? ['IN_APP', 'EMAIL']
      : ['IN_APP'];

    const deliveryResults: DeliveryRecord[] = [];
    const request: DeliveryRequest = {
      tenantId: params.tenantId,
      userId: params.userId,
      toEmail: params.email,
      title: params.title,
      body: params.body,
      channels,
    };

    for (const adapter of this.adapters) {
      if (!channels.includes(adapter.channel)) continue;
      const result = await adapter.deliver(request);
      deliveryResults.push({
        channel: result.channel,
        status: result.status,
        at: new Date().toISOString(),
        placeholder: result.placeholder,
      });
      if (result.channel === 'EMAIL' && result.status === 'PENDING') {
        this.logger.log(
          `[email-placeholder] ${params.type} → ${params.email ?? 'no-email'}: ${params.title}`,
        );
      }
    }

    const now = new Date();
    const payload = buildNotificationPayload({
      ...params.payloadExtra,
      deliveries: deliveryResults,
      analytics: { deliveredAt: now.toISOString() },
    });

    const notification = await this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        category,
        notificationType: params.type,
        title: params.title,
        body: params.body,
        actionHref: params.actionHref,
        sentAt: now,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    if (params.alsoEmail && params.email) {
      await this.prisma.notification.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.PENDING,
          category,
          notificationType: params.type,
          title: params.title,
          body: params.body,
          payload: {
            ...payload,
            linkedInAppId: notification.id,
            to: params.email,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return notification;
  }

  async shouldThrottle(
    tenantId: string,
    userId: string,
    type: LearnerNotificationType,
    cooldownHours: number,
  ): Promise<boolean> {
    const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
    const recent = await this.prisma.notification.findFirst({
      where: {
        tenantId,
        userId,
        notificationType: type,
        channel: NotificationChannel.IN_APP,
        createdAt: { gte: since },
        archivedAt: null,
      },
    });
    return Boolean(recent);
  }
}
