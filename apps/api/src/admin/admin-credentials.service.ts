import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  CertificateStatus,
  Prisma,
  VerificationTokenStatus,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { AuditService } from '../audit/audit.service';
import { generateSecureToken } from '../common/crypto.util';
import {
  buildVerificationPageUrl,
  resolvePublicVerificationStatus,
} from '../credentials/certificate-verification.types';
import type { CertificatePayload } from '../credentials/certificate.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminBaseService } from './admin-base.service';

@Injectable()
export class AdminCredentialsService extends AdminBaseService {
  constructor(
    prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    super(prisma);
  }

  async listCertificates(params?: { search?: string; limit?: number }) {
    const tenantId = await this.getTenantId();
    const limit = Math.min(params?.limit ?? 50, 100);
    const webBase =
      process.env.WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const where: Prisma.CertificateWhereInput = {
      user: { tenantId },
      status: {
        in: [
          CertificateStatus.ISSUED,
          CertificateStatus.REVOKED,
          CertificateStatus.EXPIRED,
        ],
      },
    };

    if (params?.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { certificateNo: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const rows = await this.prisma.certificate.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      take: limit,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        completion: {
          include: {
            courseVersion: {
              include: { course: { select: { slug: true, title: true } } },
            },
          },
        },
        verificationToken: true,
      },
    });

    const warnings: { type: string; message: string; certificateId: string }[] = [];

    const certificates = rows.map((c) => {
      const payload = (c.payload ?? {}) as Record<string, unknown>;
      const compliance = (payload.compliance ?? {}) as Record<string, unknown>;
      const onlineDelivery =
        compliance.onlineDeliveryDesignation === 'online' ||
        payload.deliveryMode === 'online' ||
        true;
      const ceHours = Number(payload.onlineCeuHours ?? payload.ceuHours ?? 0);
      const itemWarnings: string[] = [];
      if (!c.verificationToken) itemWarnings.push('missing_verification_token');
      if (ceHours <= 0) itemWarnings.push('zero_ce_hours');
      if (payload.immutable !== true) itemWarnings.push('payload_not_immutable');
      for (const w of itemWarnings) {
        warnings.push({
          type: w,
          message: w.replace(/_/g, ' '),
          certificateId: c.id,
        });
      }

      return {
        id: c.id,
        certificateNo: c.certificateNo,
        status: c.status,
        publicVerificationStatus: resolvePublicVerificationStatus(
          c.status,
          c.verificationToken?.status,
        ),
        issuedAt: c.issuedAt?.toISOString() ?? null,
        revokedAt: c.revokedAt?.toISOString() ?? null,
        learnerEmail: c.user.email,
        learnerName: [c.user.firstName, c.user.lastName].filter(Boolean).join(' '),
        courseTitle: c.completion.courseVersion.course.title,
        courseSlug: c.completion.courseVersion.course.slug,
        ceHours,
        onlineCeuHoursLabel:
          (payload.onlineCeuHoursLabel as string) ?? `${ceHours} Online CE hour(s)`,
        onlineDelivery,
        verificationUrl: buildVerificationPageUrl(c.certificateNo, webBase),
        verificationTokenStatus: c.verificationToken?.status ?? null,
        warnings: itemWarnings,
      };
    });

    return { certificates, complianceWarnings: warnings };
  }

  async getCertificateDetail(certificateId: string) {
    const tenantId = await this.getTenantId();
    const row = await this.prisma.certificate.findFirst({
      where: { id: certificateId, user: { tenantId } },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        verificationToken: true,
        completion: {
          include: {
            courseVersion: { include: { course: { select: { slug: true, title: true } } } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Certificate not found');

    const payload = (row.payload ?? {}) as CertificatePayload;
    const webBase =
      process.env.WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    return {
      id: row.id,
      certificateNo: row.certificateNo,
      status: row.status,
      publicVerificationStatus: resolvePublicVerificationStatus(
        row.status,
        row.verificationToken?.status,
      ),
      issuedAt: row.issuedAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      revokeReason: row.revokeReason ?? null,
      learnerEmail: row.user.email,
      learnerName:
        [row.user.firstName, row.user.lastName].filter(Boolean).join(' ') || row.user.email,
      courseTitle: row.completion.courseVersion.course.title,
      courseSlug: row.completion.courseVersion.course.slug,
      verificationUrl: buildVerificationPageUrl(row.certificateNo, webBase),
      verificationToken: row.verificationToken
        ? {
            id: row.verificationToken.id,
            status: row.verificationToken.status,
            revokedAt: row.verificationToken.revokedAt?.toISOString() ?? null,
            metadata: row.verificationToken.metadata,
          }
        : null,
      payload,
    };
  }

  async revokeCertificate(certificateId: string, actor: AuthUser, reason?: string) {
    return this.setCertificateLifecycle(certificateId, actor, 'revoke', reason);
  }

  async restoreCertificate(certificateId: string, actor: AuthUser) {
    return this.setCertificateLifecycle(certificateId, actor, 'restore');
  }

  async archiveCertificate(certificateId: string, actor: AuthUser) {
    return this.setCertificateLifecycle(certificateId, actor, 'archive');
  }

  private async setCertificateLifecycle(
    certificateId: string,
    actor: AuthUser,
    action: 'revoke' | 'restore' | 'archive',
    reason?: string,
  ) {
    const tenantId = await this.getTenantId();
    const row = await this.prisma.certificate.findFirst({
      where: { id: certificateId, user: { tenantId } },
      include: { verificationToken: true },
    });
    if (!row) throw new NotFoundException('Certificate not found');

    const now = new Date();

    if (action === 'revoke') {
      if (row.status === CertificateStatus.REVOKED) {
        throw new BadRequestException('Certificate is already revoked');
      }
      await this.prisma.certificate.update({
        where: { id: row.id },
        data: {
          status: CertificateStatus.REVOKED,
          revokedAt: now,
          revokeReason: reason ?? null,
        },
      });
      await this.upsertVerificationToken(row.id, row.verificationToken?.id, {
        status: VerificationTokenStatus.REVOKED,
        revokedAt: now,
      });
    } else if (action === 'restore') {
      if (
        row.status !== CertificateStatus.REVOKED &&
        row.status !== CertificateStatus.EXPIRED
      ) {
        throw new BadRequestException('Only revoked or archived certificates can be restored');
      }
      await this.prisma.certificate.update({
        where: { id: row.id },
        data: { status: CertificateStatus.ISSUED, revokedAt: null },
      });
      await this.upsertVerificationToken(row.id, row.verificationToken?.id, {
        status: VerificationTokenStatus.ACTIVE,
        revokedAt: null,
        newToken: !row.verificationToken,
      });
    } else {
      await this.prisma.certificate.update({
        where: { id: row.id },
        data: { status: CertificateStatus.EXPIRED },
      });
      await this.upsertVerificationToken(row.id, row.verificationToken?.id, {
        status: VerificationTokenStatus.EXPIRED,
        revokedAt: now,
      });
    }

    await this.audit.log({
      tenantId,
      actorId: actor.userId,
      action: AuditAction.UPDATE,
      entityType: 'certificate',
      entityId: row.id,
      metadata: {
        lifecycle: action,
        certificateNo: row.certificateNo,
        reason: reason ?? null,
      },
    });

    return this.getCertificateDetail(certificateId);
  }

  private async upsertVerificationToken(
    certificateId: string,
    existingId: string | undefined,
    opts: {
      status: VerificationTokenStatus;
      revokedAt?: Date | null;
      newToken?: boolean;
    },
  ) {
    if (existingId) {
      await this.prisma.certificateVerificationToken.update({
        where: { id: existingId },
        data: {
          status: opts.status,
          revokedAt: opts.revokedAt ?? null,
        },
      });
      return;
    }
    await this.prisma.certificateVerificationToken.create({
      data: {
        certificateId,
        token: generateSecureToken(32),
        status: opts.status,
        revokedAt: opts.revokedAt ?? undefined,
      },
    });
  }
}
