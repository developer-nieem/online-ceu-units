import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AssessmentAttemptStatus,
  AssessmentKind,
  AuditAction,
  CertificateStatus,
  CompletionStatus,
  EnrollmentStatus,
  VerificationTokenStatus,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { AuditService } from '../audit/audit.service';
import { generateSecureToken } from '../common/crypto.util';
import { PrismaService } from '../prisma/prisma.service';
import { formatOnlineCeuHours } from '../config/ceu-defaults';
import {
  CDPH_ONLINE_CEU,
  hasUsableCnaLicenseNumber,
  requiredSeatTimeMinutes,
} from '../assessments/cdph-compliance.constants';
import { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CertificateCeuSyncService } from './certificate-ceu-sync.service';
import {
  CA_CNA_COMPLIANCE,
  CERTIFICATE_EXPORT_PLACEHOLDERS,
} from './credentials.constants';
import {
  buildVerificationPageUrl,
  resolvePublicVerificationStatus,
  type PublicCertificateVerificationRecord,
  type PublicCertificateVerificationResponse,
} from './certificate-verification.types';

export type CertificatePayload = {
  learnerName: string;
  cnaCertificateNumber?: string | null;
  courseTitle: string;
  ceuHours: number;
  /** CDPH online CE: hours delivered via internet (shown on certificate). */
  onlineCeuHours: number;
  onlineCeuHoursLabel: string;
  deliveryMode: 'online';
  completedAt: string;
  certificateId: string;
  certificateNo: string;
  verificationCode: string;
  provider: {
    name: string;
    contactEmail: string;
    contactPhone?: string | null;
    contactAddress?: string | null;
    providerNumber: string | null;
    approvalStatusLabel: string | null;
    onlineCeApproved: boolean;
  };
  instructor: { name: string };
  jurisdiction: { code: string; label: string };
  profession: { code: string; label: string };
  categorySlug: string | null;
  exports: typeof CERTIFICATE_EXPORT_PLACEHOLDERS;
};

@Injectable()
export class CertificateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ceuSync: CertificateCeuSyncService,
    private readonly providerSettings: ProviderComplianceSettingsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async listForUser(user: AuthUser) {
    await this.ceuSync.syncStaleCertificatesForUser(user.userId);
    const rows = await this.prisma.certificate.findMany({
      where: { userId: user.userId, status: CertificateStatus.ISSUED },
      include: {
        completion: {
          include: {
            courseVersion: { include: { course: { include: { category: true } } } },
          },
        },
        verificationToken: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return rows.map((row) => this.toCertificateDto(row));
  }

  async getForUser(user: AuthUser, certificateId: string) {
    const row = await this.prisma.certificate.findFirst({
      where: { id: certificateId, userId: user.userId },
      include: {
        completion: {
          include: {
            courseVersion: { include: { course: { include: { category: true } } } },
          },
        },
        verificationToken: true,
      },
    });
    if (!row) throw new NotFoundException('Certificate not found');
    if (row.completionId) {
      await this.ceuSync.syncCompletionCeuHours(row.completionId);
    }
    const refreshed = await this.prisma.certificate.findFirst({
      where: { id: certificateId, userId: user.userId },
      include: {
        completion: {
          include: {
            courseVersion: { include: { course: { include: { category: true } } } },
          },
        },
        verificationToken: true,
      },
    });
    return this.toCertificateDto(refreshed ?? row);
  }

  async verifyBySerialAndLastName(
    serialNumber: string,
    lastName: string,
  ): Promise<PublicCertificateVerificationResponse> {
    const normalizedSerial = decodeURIComponent(serialNumber).trim();
    const normalizedLastName = decodeURIComponent(lastName).trim();

    if (!normalizedSerial || !normalizedLastName) {
      return {
        found: false,
        message: 'Certificate serial number and student last name are required.',
      };
    }

    const row = await this.prisma.certificate.findFirst({
      where: {
        certificateNo: { equals: normalizedSerial, mode: 'insensitive' },
        user: {
          lastName: { equals: normalizedLastName, mode: 'insensitive' },
        },
      },
      include: {
        verificationToken: true,
        completion: {
          include: { courseVersion: { include: { course: true } } },
        },
      },
    });

    if (!row) {
      return {
        found: false,
        message: 'Certificate not found or invalid.',
      };
    }

    return {
      found: true,
      record: this.toPublicVerificationRecord(row),
    };
  }

  async verifyByCertificateNumber(
    certificateNo: string,
  ): Promise<PublicCertificateVerificationResponse> {
    const normalized = decodeURIComponent(certificateNo).trim();
    if (!normalized) {
      return { found: false, message: 'Certificate number is required.' };
    }

    const row = await this.prisma.certificate.findFirst({
      where: { certificateNo: { equals: normalized, mode: 'insensitive' } },
      include: {
        verificationToken: true,
        completion: {
          include: { courseVersion: { include: { course: true } } },
        },
      },
    });

    if (!row) {
      return {
        found: false,
        message: 'No certificate found for this certificate number.',
      };
    }

    return {
      found: true,
      record: this.toPublicVerificationRecord(row),
    };
  }

  /** Legacy token lookup — returns same public shape as certificate number verify. */
  async verifyByToken(token: string): Promise<PublicCertificateVerificationResponse> {
    const record = await this.prisma.certificateVerificationToken.findFirst({
      where: { token },
      include: {
        certificate: {
          include: {
            completion: {
              include: { courseVersion: { include: { course: true } } },
            },
          },
        },
      },
    });

    if (!record?.certificate) {
      return {
        found: false,
        message: 'Verification code not found or certificate is no longer valid.',
      };
    }

    return {
      found: true,
      record: this.toPublicVerificationRecord(record.certificate, record.status),
    };
  }

  private toPublicVerificationRecord(
    row: {
      certificateNo: string;
      status: CertificateStatus;
      payload: unknown;
      issuedAt: Date | null;
      revokeReason?: string | null;
      verificationToken?: { status: VerificationTokenStatus } | null;
      completion?: {
        ceHoursEarned: unknown;
        completedAt: Date;
        courseVersion?: { ceHours?: unknown; course?: { title?: string } };
      } | null;
    },
    tokenStatusOverride?: VerificationTokenStatus,
  ): PublicCertificateVerificationRecord {
    const payload = (row.payload ?? {}) as CertificatePayload;
    const completion = row.completion;
    const ceuHours = this.ceuSync.resolveAuthoritativeCeuHours(
      completion?.courseVersion?.ceHours,
      payload.onlineCeuHours ?? payload.ceuHours ?? completion?.ceHoursEarned,
    );
    const completedAt =
      payload.completedAt ?? completion?.completedAt?.toISOString() ?? row.issuedAt?.toISOString();
    const completionDate = completedAt
      ? new Date(completedAt).toISOString().slice(0, 10)
      : '—';
    const issueDate = row.issuedAt
      ? row.issuedAt.toISOString().slice(0, 10)
      : completionDate;

    const status = resolvePublicVerificationStatus(
      row.status,
      tokenStatusOverride ?? row.verificationToken?.status,
    );

    return {
      certificateNumber: row.certificateNo,
      learnerName: payload.learnerName ?? 'Learner',
      courseTitle: payload.courseTitle ?? completion?.courseVersion?.course?.title ?? 'Course',
      completionDate,
      issueDate,
      ceUnitsEarned: ceuHours,
      ceUnitsLabel: formatOnlineCeuHours(ceuHours),
      deliveryMethod: 'Online',
      status,
      revokeReason: status === 'Revoked' ? (row.revokeReason ?? null) : undefined,
    };
  }

  private getWebBaseUrl(): string {
    return process.env.WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  }

  /** Issue certificate + verification token for a completion (idempotent). */
  async issueForCompletion(
    completionId: string,
    actorId?: string,
  ): Promise<{
    id: string;
    certificateNo: string;
    payload: unknown;
  } | null> {
    const completion = await this.prisma.completion.findUnique({
      where: { id: completionId },
      include: {
        certificate: { include: { verificationToken: true } },
        courseVersion: { include: { course: { include: { category: true } } } },
        user: { include: { learnerProfile: { select: { licenseNumber: true } } } },
        enrollment: true,
      },
    });
    if (!completion) return null;

    const enrollment = completion.enrollment;
    if (
      !enrollment ||
      enrollment.deletedAt ||
      enrollment.status === EnrollmentStatus.REQUIRES_REPURCHASE ||
      enrollment.status === EnrollmentStatus.REQUIRES_RESET ||
      (enrollment.expiresAt && enrollment.expiresAt < new Date())
    ) {
      return null;
    }

    const ceHoursForGate = Number(completion.courseVersion.ceHours);
    const requiredActiveSeconds = requiredSeatTimeMinutes(ceHoursForGate) * 60;
    const enrollmentMeta = (completion.enrollment?.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const participationMeta = (enrollmentMeta.participation ?? {}) as Record<
      string,
      unknown
    >;
    const ledgerMeta = (participationMeta.ledger ?? {}) as Record<string, unknown>;
    const trackedActiveSeconds = Math.max(
      completion.enrollment?.activeParticipationSeconds ?? 0,
      Number(ledgerMeta.activeSeconds ?? participationMeta.activeSeconds ?? 0),
    );
    if (trackedActiveSeconds < requiredActiveSeconds) {
      return null;
    }

    if (completion.certificate?.status === CertificateStatus.ISSUED) {
      await this.ceuSync.syncCompletionCeuHours(completion.id);
      const refreshed = await this.prisma.certificate.findUnique({
        where: { id: completion.certificate.id },
      });
      return refreshed ?? completion.certificate;
    }

    if (!hasUsableCnaLicenseNumber(completion.user.learnerProfile?.licenseNumber)) {
      return null;
    }

    const dbUser = completion.user;
    const profile = dbUser.learnerProfile;
    const learnerName =
      [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || dbUser.email;
    const course = completion.courseVersion.course;
    const completedAt = completion.completedAt;
    const certificateNo = await this.generateCertificateNo();
    const verificationCode = this.generateVerificationCode();
    const verifyToken = generateSecureToken(32);
    const now = new Date();

    const ceuHours = this.ceuSync.resolveAuthoritativeCeuHours(
      completion.courseVersion.ceHours,
      completion.ceHoursEarned,
    );
    const tenantSettings = await this.providerSettings.getForTenant(completion.user.tenantId);
    const providerFields = this.providerSettings.certificateProviderFields(tenantSettings);
    const instructor = this.providerSettings.instructorDisplay(
      tenantSettings,
      (course.catalogData as { instructor?: string })?.instructor,
    );

    const payload: CertificatePayload = {
      learnerName,
      cnaCertificateNumber: profile?.licenseNumber ?? null,
      courseTitle: course.title,
      ceuHours,
      onlineCeuHours: ceuHours,
      onlineCeuHoursLabel: formatOnlineCeuHours(ceuHours),
      deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
      completedAt: completedAt.toISOString(),
      certificateId: '',
      certificateNo,
      verificationCode,
      provider: {
        name: providerFields.name,
        contactEmail: providerFields.contactEmail,
        contactPhone: providerFields.providerContactPhone ?? null,
        contactAddress: providerFields.providerContactAddress ?? null,
        providerNumber: providerFields.nacReference || null,
        approvalStatusLabel: providerFields.showApprovalToLearners
          ? providerFields.approvalStatusLabel
          : null,
        onlineCeApproved: tenantSettings.cdphOnlineApproved,
      },
      instructor,
      jurisdiction: {
        code: CA_CNA_COMPLIANCE.jurisdictionCode,
        label: CA_CNA_COMPLIANCE.jurisdictionLabel,
      },
      profession: {
        code: CA_CNA_COMPLIANCE.professionCode,
        label: CA_CNA_COMPLIANCE.professionLabel,
      },
      categorySlug: course.category?.slug ?? null,
      exports: CERTIFICATE_EXPORT_PLACEHOLDERS,
    };

    const attemptId = await this.resolveEarningAttemptId(enrollment.id);

    const certificate = await this.prisma.$transaction(async (tx) => {
      const cert = await tx.certificate.upsert({
        where: { completionId: completion.id },
        create: {
          completionId: completion.id,
          userId: completion.userId,
          certificateNo,
          status: CertificateStatus.ISSUED,
          issuedAt: now,
          payload,
          attemptId,
        },
        update: {
          status: CertificateStatus.ISSUED,
          issuedAt: now,
          payload,
          revokedAt: null,
          attemptId,
        },
      });

      payload.certificateId = cert.id;

      await tx.certificate.update({
        where: { id: cert.id },
        data: { payload },
      });

      await tx.certificateVerificationToken.upsert({
        where: { certificateId: cert.id },
        create: {
          certificateId: cert.id,
          token: verifyToken,
          status: VerificationTokenStatus.ACTIVE,
          metadata: { verificationCode, publicVerify: true },
        },
        update: {
          token: verifyToken,
          status: VerificationTokenStatus.ACTIVE,
          revokedAt: null,
        },
      });

      await tx.completion.update({
        where: { id: completion.id },
        data: {
          status: CompletionStatus.APPROVED,
          approvedAt: now,
          ceHoursEarned: ceuHours,
          metadata: {
            ...(completion.metadata as object),
            certificateIssued: true,
            certificateNo,
            ceuHoursSource: 'course_version',
          },
        },
      });

      return cert;
    });

    const auditEntry = await this.audit.log({
      tenantId: completion.enrollment.tenantId,
      actorId: actorId ?? completion.userId,
      action: AuditAction.ISSUE_CERTIFICATE,
      entityType: 'certificate',
      entityId: certificate.id,
      after: { certificateNo, verificationCode },
      metadata: { completionId: completion.id, courseSlug: course.slug },
    });

    await this.prisma.certificateVerificationToken.update({
      where: { certificateId: certificate.id },
      data: { auditLogId: auditEntry.id },
    });

    void this.notifications
      .notifyCertificateReady(
        completion.user.tenantId,
        completion.userId,
        course.title,
        certificate.id,
      )
      .catch(() => undefined);

    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    const verifyUrl = `${webUrl.replace(/\/$/, '')}/verify-certificate/token/${encodeURIComponent(verifyToken)}`;
    void this.notifications
      .sendCertificateReadyEmail({
        tenantId: completion.user.tenantId,
        userId: completion.userId,
        to: completion.user.email,
        firstName: completion.user.firstName ?? undefined,
        courseTitle: payload.courseTitle,
        certificateNo,
        ceuHours: payload.onlineCeuHours ?? payload.ceuHours,
        verifyUrl,
      })
      .catch(() => undefined);

    return certificate;
  }

  /**
   * The single PASSED final-exam attempt on this enrollment.
   * Zero matches or more than one → null. Never guesses. Never blocks issuance.
   */
  private async resolveEarningAttemptId(enrollmentId: string): Promise<string | null> {
    try {
      const passed = await this.prisma.assessmentAttempt.findMany({
        where: {
          enrollmentId,
          status: AssessmentAttemptStatus.PASSED,
          assessment: { kind: AssessmentKind.FINAL_EXAM },
        },
        select: { id: true },
        take: 2,
      });
      if (passed.length !== 1) return null;
      return passed[0]?.id ?? null;
    } catch {
      return null;
    }
  }

  private async generateCertificateNo(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = generateSecureToken(4).replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase();
      const no = `CALACE-${year}-${suffix}`;
      const exists = await this.prisma.certificate.findUnique({
        where: { certificateNo: no },
      });
      if (!exists) return no;
    }
    return `CALACE-${year}-${generateSecureToken(8).slice(0, 8).toUpperCase()}`;
  }

  private generateVerificationCode(): string {
    return generateSecureToken(6).replace(/[^A-Z0-9]/gi, '').slice(0, 10).toUpperCase();
  }

  private toCertificateDto(
    row: {
      id: string;
      certificateNo: string;
      status: string;
      issuedAt: Date | null;
      expiresAt: Date | null;
      payload: unknown;
      completion?: {
        ceHoursEarned: unknown;
        completedAt: Date;
        courseVersion?: {
          ceHours?: unknown;
          course?: { slug?: string; title?: string };
        };
      } | null;
      verificationToken?: { token: string; status: VerificationTokenStatus } | null;
    },
  ) {
    const payload = (row.payload ?? {}) as CertificatePayload;
    const course = row.completion?.courseVersion?.course;
    const authoritative = this.ceuSync.resolveAuthoritativeCeuHours(
      row.completion?.courseVersion?.ceHours,
      payload.onlineCeuHours ?? payload.ceuHours ?? row.completion?.ceHoursEarned,
    );
    const displayPayload =
      authoritative !== Number(payload.ceuHours ?? 0)
        ? this.ceuSync.applyHoursToPayload(payload, authoritative)
        : payload;

    return {
      id: row.id,
      certificateNo: row.certificateNo,
      status: row.status,
      issuedAt: row.issuedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      courseSlug: course?.slug ?? null,
      courseTitle: displayPayload.courseTitle ?? course?.title ?? 'Course',
      ceuHours: authoritative,
      onlineCeuHoursLabel: formatOnlineCeuHours(authoritative),
      learnerName: displayPayload.learnerName,
      completedAt: displayPayload.completedAt ?? row.completion?.completedAt?.toISOString(),
      verificationCode: displayPayload.verificationCode,
      verifyToken: row.verificationToken?.token ?? null,
      verificationUrl: buildVerificationPageUrl(row.certificateNo, this.getWebBaseUrl()),
      publicVerificationStatus: resolvePublicVerificationStatus(
        row.status as CertificateStatus,
        row.verificationToken?.status,
      ),
      payload: this.sanitizePayloadForLearner(displayPayload),
      download: CERTIFICATE_EXPORT_PLACEHOLDERS.pdf,
      qrPlaceholder: CERTIFICATE_EXPORT_PLACEHOLDERS.qr,
    };
  }

  private sanitizePayloadForLearner(payload: CertificatePayload): CertificatePayload {
    const legacy = payload as CertificatePayload & {
      admin?: unknown;
      cdph?: unknown;
    };
    const { admin: _a, cdph: _c, ...safe } = legacy;
    return safe as CertificatePayload;
  }
}
