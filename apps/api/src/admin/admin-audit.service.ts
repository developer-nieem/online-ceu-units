import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@calace/db';

import { AdminBaseService } from './admin-base.service';

export type AuditCategory =
  | 'all'
  | 'login'
  | 'enrollment'
  | 'participation'
  | 'exam'
  | 'attestation'
  | 'certificate';

@Injectable()
export class AdminAuditService extends AdminBaseService {
  async listAuditLog(params?: { category?: AuditCategory; limit?: number }) {
    const tenantId = await this.getTenantId();
    const limit = Math.min(params?.limit ?? 100, 200);
    const category = params?.category ?? 'all';

    const where: Prisma.AuditLogWhereInput = { tenantId };

    switch (category) {
      case 'login':
        where.action = AuditAction.LOGIN;
        break;
      case 'enrollment':
        where.entityType = 'enrollment';
        break;
      case 'participation':
        where.entityType = 'participation_heartbeat';
        break;
      case 'exam':
        where.entityType = 'assessment_attempt';
        break;
      case 'attestation':
        where.entityType = 'enrollment';
        where.action = AuditAction.UPDATE;
        break;
      case 'certificate':
        where.OR = [
          { action: AuditAction.ISSUE_CERTIFICATE },
          { entityType: 'certificate' },
        ];
        break;
      default:
        break;
    }

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    const filtered =
      category === 'attestation'
        ? rows.filter((row) => {
            const meta = (row.metadata ?? {}) as Record<string, unknown>;
            return meta.cdph === 'certificate_attestation';
          })
        : rows;

    return filtered.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      category: this.inferCategory(row),
      actorEmail: row.actor?.email ?? null,
      ipAddress: row.ipAddress,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private inferCategory(row: {
    action: AuditAction;
    entityType: string;
    metadata: unknown;
  }): AuditCategory {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    if (row.action === AuditAction.LOGIN) return 'login';
    if (row.action === AuditAction.ISSUE_CERTIFICATE || row.entityType === 'certificate') {
      return 'certificate';
    }
    if (row.entityType === 'participation_heartbeat') return 'participation';
    if (row.entityType === 'assessment_attempt') return 'exam';
    if (meta.cdph === 'certificate_attestation') return 'attestation';
    if (row.entityType === 'enrollment') return 'enrollment';
    return 'all';
  }
}
