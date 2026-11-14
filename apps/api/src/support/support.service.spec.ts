import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupportTicketPriority, SupportTicketStatus } from '@calace/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '../auth/types/auth-user.type';
import type { PrismaService } from '../prisma/prisma.service';
import { SupportService } from './support.service';

const NOW = new Date('2026-10-28T16:00:00.000Z');

const learner: AuthUser = {
  sub: 'user-1',
  userId: 'user-1',
  email: 'ada@example.com',
  tenantId: 'tenant-1',
  roles: ['learner'],
  emailVerified: true,
};

const otherLearner: AuthUser = {
  ...learner,
  sub: 'user-2',
  userId: 'user-2',
  email: 'other@example.com',
};

function ticketRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ticket-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    subject: 'Certificate download',
    description: 'My certificate did not download after I passed.',
    status: SupportTicketStatus.OPEN,
    priority: SupportTicketPriority.MEDIUM,
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
    ...overrides,
  };
}

function createHarness() {
  const prisma = {
    user: { findFirst: vi.fn().mockResolvedValue({ id: 'user-1' }) },
    supportTicket: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
        ticketRow({
          subject: data.subject,
          description: data.description,
          priority: data.priority,
          status: data.status,
          thread: data.thread,
          userId: data.userId,
          tenantId: data.tenantId,
        }),
      ),
    },
  };
  const service = new SupportService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('SupportService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves a ticket for the authenticated student and ignores a client-supplied user id', async () => {
    const { service, prisma } = createHarness();

    const created = await service.create(learner, {
      subject: '  Certificate download  ',
      message: '  My certificate did not download after I passed.  ',
      priority: SupportTicketPriority.HIGH,
      userId: 'someone-else',
    } as never);

    expect(prisma.supportTicket.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        subject: 'Certificate download',
        description: 'My certificate did not download after I passed.',
        priority: SupportTicketPriority.HIGH,
        status: SupportTicketStatus.OPEN,
        thread: [
          {
            message: 'My certificate did not download after I passed.',
            at: NOW.toISOString(),
            authorRole: 'learner',
          },
        ],
      },
    });
    expect(created).toMatchObject({
      id: 'ticket-1',
      subject: 'Certificate download',
      message: 'My certificate did not download after I passed.',
      status: SupportTicketStatus.OPEN,
      priority: SupportTicketPriority.HIGH,
      staffReplies: [],
    });
  });

  it('rejects a message that is too short and does not write a ticket', async () => {
    const { service, prisma } = createHarness();

    await expect(
      service.create(learner, {
        subject: 'Help',
        message: 'too short',
        priority: SupportTicketPriority.LOW,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown priority', async () => {
    const { service, prisma } = createHarness();

    await expect(
      service.create(learner, {
        subject: 'Need a hand',
        message: 'The course player will not resume my lesson.',
        priority: 'CRITICAL' as SupportTicketPriority,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('does not create a ticket when the account is missing', async () => {
    const { service, prisma } = createHarness();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.create(learner, {
        subject: 'Need a hand',
        message: 'The course player will not resume my lesson.',
        priority: SupportTicketPriority.MEDIUM,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('lists only the authenticated student tickets in their tenant', async () => {
    const { service, prisma } = createHarness();
    prisma.supportTicket.findMany.mockResolvedValue([
      ticketRow({
        thread: [
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
        ],
      }),
    ]);

    const result = await service.listMine(learner);

    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    expect(result.tickets).toEqual([
      expect.objectContaining({
        id: 'ticket-1',
        staffReplies: [{ message: 'We reissued the certificate.', at: NOW.toISOString() }],
      }),
    ]);

    await service.listMine(otherLearner);
    expect(prisma.supportTicket.findMany).toHaveBeenLastCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-2', deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  });
});
