import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
  SubscriptionStatus,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@calace/db';

import { appendStaffReply, toAdminTicket } from '../support/support-ticket.mapper';
import { AdminBaseService } from './admin-base.service';
import type { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { paidRealStripeOrderWhere, realStripeOrderWhere } from './real-stripe-order';

const OPEN_TICKET_STATUSES = [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS];

@Injectable()
export class AdminSupportService extends AdminBaseService {
  async getRevenuePlaceholder() {
    const tenantId = await this.getTenantId();

    const [paidAgg, refunds, failed, subscriptions, recentOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: paidRealStripeOrderWhere(tenantId),
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.order.count({ where: { tenantId, status: OrderStatus.REFUNDED } }),
      this.prisma.order.count({ where: { tenantId, status: OrderStatus.FAILED } }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      this.prisma.order.findMany({
        where: realStripeOrderWhere(tenantId),
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          placedAt: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);

    return {
      totalRevenue: Number(paidAgg._sum.total ?? 0),
      paidOrderCount: paidAgg._count.id,
      refunds,
      failedPayments: failed,
      subscriptionCount:
        subscriptions.find((s) => s.status === SubscriptionStatus.ACTIVE)?._count.id ?? 0,
      subscriptionsByStatus: subscriptions.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      stripeStatus: 'placeholder_not_connected',
      stripeNote: 'Connect Stripe webhooks in a future phase.',
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        learnerEmail: o.user.email,
        placedAt: o.placedAt?.toISOString() ?? o.createdAt.toISOString(),
      })),
      placeholder: true,
    };
  }

  async getSupportQueue() {
    const tenantId = await this.getTenantId();
    const openWhere = {
      tenantId,
      deletedAt: null,
      status: { in: OPEN_TICKET_STATUSES },
    };

    const [openTickets, urgentOpenTickets, tickets] = await Promise.all([
      this.prisma.supportTicket.count({ where: openWhere }),
      this.prisma.supportTicket.count({
        where: {
          ...openWhere,
          priority: { in: [SupportTicketPriority.HIGH, SupportTicketPriority.URGENT] },
        },
      }),
      this.prisma.supportTicket.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: { user: { select: { email: true } } },
      }),
    ]);

    return {
      openTickets,
      urgentOpenTickets,
      recentTickets: tickets.map((ticket) => toAdminTicket(ticket)),
    };
  }

  async updateTicket(ticketId: string, dto: UpdateSupportTicketDto) {
    if (!Object.values(SupportTicketStatus).includes(dto.status)) {
      throw new BadRequestException('Choose a valid ticket status.');
    }

    const tenantId = await this.getTenantId();
    const existing = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, tenantId, deletedAt: null },
      include: { user: { select: { email: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Support ticket not found');
    }

    const note = dto.staffNote?.trim();
    const closing =
      dto.status === SupportTicketStatus.RESOLVED || dto.status === SupportTicketStatus.CLOSED;

    const updated = await this.prisma.supportTicket.update({
      where: { id: existing.id },
      data: {
        status: dto.status,
        resolvedAt: closing ? (existing.resolvedAt ?? new Date()) : null,
        ...(note
          ? {
              thread: appendStaffReply(
                existing.thread,
                note,
                new Date().toISOString(),
              ) as Prisma.InputJsonValue,
            }
          : {}),
      },
      include: { user: { select: { email: true } } },
    });

    return toAdminTicket(updated);
  }
}
