import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@calace/db';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    tenantId?: string;
    actorId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        before: params.before,
        after: params.after,
        metadata: params.metadata ?? {},
      },
    });
  }
}
