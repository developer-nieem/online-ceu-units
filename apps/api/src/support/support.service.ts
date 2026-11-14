import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupportTicketPriority, SupportTicketStatus } from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { toLearnerTicket } from './support-ticket.mapper';

const SUBJECT_MIN = 3;
const SUBJECT_MAX = 160;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(user: AuthUser) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.userId,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return { tickets: tickets.map((ticket) => toLearnerTicket(ticket)) };
  }

  async create(user: AuthUser, dto: CreateSupportTicketDto) {
    const subject = dto.subject.trim();
    const message = dto.message.trim();
    this.assertContent(subject, message);
    if (!Object.values(SupportTicketPriority).includes(dto.priority)) {
      throw new BadRequestException('Choose a valid priority.');
    }

    const account = await this.prisma.user.findFirst({
      where: { id: user.userId, tenantId: user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        tenantId: user.tenantId,
        userId: user.userId,
        subject,
        description: message,
        priority: dto.priority,
        status: SupportTicketStatus.OPEN,
        thread: [
          {
            message,
            at: new Date().toISOString(),
            authorRole: 'learner',
          },
        ],
      },
    });

    return toLearnerTicket(ticket);
  }

  private assertContent(subject: string, message: string) {
    if (subject.length < SUBJECT_MIN || subject.length > SUBJECT_MAX) {
      throw new BadRequestException('Subject must be between 3 and 160 characters.');
    }
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
      throw new BadRequestException('Message must be between 10 and 5000 characters.');
    }
  }
}
