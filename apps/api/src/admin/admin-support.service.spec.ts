import { NotFoundException } from '@nestjs/common';
import { SupportTicketPriority, SupportTicketStatus } from '@calace/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../prisma/prisma.service';
import { AdminSupportService } from './admin-support.service';

const TENANT_ID = 'tenant-cal-ace';
const NOW = new Date('2026-10-28T16:00:00.000Z');

function ticketRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ticket-1',
    tenantId: TENANT_ID,
    userId: 'user-1',
    subject: 'Certificate download',
    description: 'My certificate did not download after I passed.',
    status: SupportTicketStatus.OPEN,
    priority: SupportTicketPriority.HIGH,
    thread: [
      {
        message: 'My certificate did not download after I passed.',
        at: NOW.toISOString(),
        authorRole: 'learner',
      },
    ],
    resolvedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    user: { email: 'ada@example.com' },
    ...overrides,
  };
}

function createHarness() {
  const prisma = {
    tenant: { findFirst: vi.fn().mockResolvedValue({ id: TENANT_ID }) },
    supportTicket: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  };
  const service = new AdminSupportService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('AdminSupportService support queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns tenant tickets for the admin dashboard', async () => {
    const { service, prisma } = createHarness();
    prisma.supportTicket.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    prisma.supportTicket.findMany.mockResolvedValue([ticketRow()]);

    const result = await service.getSupportQueue();

    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true } } },
    });
    expect(result.openTickets).toBe(2);
    expect(result.urgentOpenTickets).toBe(1);
    expect(result.recentTickets).toEqual([
      expect.objectContaining({
        id: 'ticket-1',
        subject: 'Certificate download',
        learnerEmail: 'ada@example.com',
        message: 'My certificate did not download after I passed.',
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.HIGH,
      }),
    ]);
  });

  it('updates status, keeps the student owner, and stores a staff reply', async () => {
    const { service, prisma } = createHarness();
    const existing = ticketRow();
    prisma.supportTicket.findFirst.mockResolvedValue(existing);
    prisma.supportTicket.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      ticketRow({
        status: data.status,
        resolvedAt: data.resolvedAt,
        thread: data.thread,
      }),
    );

    const updated = await service.updateTicket('ticket-1', {
      status: SupportTicketStatus.RESOLVED,
      staffNote: '  We reissued the certificate.  ',
    });

    const updateCall = prisma.supportTicket.update.mock.calls[0]?.[0];
    expect(prisma.supportTicket.findFirst).toHaveBeenCalledWith({
      where: { id: 'ticket-1', tenantId: TENANT_ID, deletedAt: null },
      include: { user: { select: { email: true } } },
    });
    expect(updateCall.where).toEqual({ id: 'ticket-1' });
    expect(updateCall.data.status).toBe(SupportTicketStatus.RESOLVED);
    expect(updateCall.data.resolvedAt).toEqual(NOW);
    expect(updateCall.data.userId).toBeUndefined();
    expect(updateCall.data.thread).toEqual([
      {
        message: 'My certificate did not download after I passed.',
        at: NOW.toISOString(),
        authorRole: 'learner',
      },
      {
        message: 'We reissued the certificate.',
        at: NOW.toISOString(),
        authorRole: 'staff',
      },
    ]);
    expect(updated.staffReplies).toEqual([
      { message: 'We reissued the certificate.', at: NOW.toISOString() },
    ]);
    expect(updated.learnerEmail).toBe('ada@example.com');
  });

  it('clears resolvedAt when a ticket is reopened', async () => {
    const { service, prisma } = createHarness();
    prisma.supportTicket.findFirst.mockResolvedValue(
      ticketRow({ status: SupportTicketStatus.RESOLVED, resolvedAt: NOW }),
    );
    prisma.supportTicket.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      ticketRow({ status: data.status, resolvedAt: data.resolvedAt }),
    );

    await service.updateTicket('ticket-1', { status: SupportTicketStatus.OPEN });

    expect(prisma.supportTicket.update.mock.calls[0]?.[0].data).toMatchObject({
      status: SupportTicketStatus.OPEN,
      resolvedAt: null,
    });
    expect(prisma.supportTicket.update.mock.calls[0]?.[0].data.thread).toBeUndefined();
  });

  it('does not update a ticket outside the tenant', async () => {
    const { service, prisma } = createHarness();
    prisma.supportTicket.findFirst.mockResolvedValue(null);

    await expect(
      service.updateTicket('other-tenant-ticket', { status: SupportTicketStatus.CLOSED }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.supportTicket.update).not.toHaveBeenCalled();
  });
});
