import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CertificateStatus, CompletionStatus } from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CertificateCeuSyncService } from './certificate-ceu-sync.service';
import { CertificateService } from './certificate.service';
import { ComplianceService } from './compliance.service';
import { TranscriptService } from './transcript.service';

/** Coordinates certificate issuance, transcript ledger, and compliance updates. */
@Injectable()
export class CredentialsOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificates: CertificateService,
    @Inject(forwardRef(() => TranscriptService))
    private readonly transcript: TranscriptService,
    @Inject(forwardRef(() => ComplianceService))
    private readonly compliance: ComplianceService,
    private readonly ceuSync: CertificateCeuSyncService,
  ) {}

  /**
   * Backfill certificates and transcript entries for completions that finalized
   * without running the full orchestration path.
   */
  async syncPendingCompletions(user: Pick<AuthUser, 'userId'>) {
    const pending = await this.prisma.completion.findMany({
      where: {
        userId: user.userId,
        status: { in: [CompletionStatus.PENDING, CompletionStatus.APPROVED] },
        certificate: null,
      },
    });
    for (const completion of pending) {
      await this.processCompletion(completion.id, user.userId);
    }

    const withPendingCert = await this.prisma.completion.findMany({
      where: {
        userId: user.userId,
        certificate: { status: CertificateStatus.PENDING },
      },
    });
    for (const completion of withPendingCert) {
      await this.processCompletion(completion.id, user.userId);
    }

    await this.backfillMissingTranscriptEntries(user.userId);
  }

  async processCompletion(completionId: string, actorId?: string): Promise<{ id: string } | null> {
    const certificate = await this.certificates.issueForCompletion(completionId, actorId);
    if (!certificate) return null;

    const completion = await this.prisma.completion.findUnique({
      where: { id: completionId },
      include: {
        courseVersion: { include: { course: { include: { category: true } } } },
        enrollment: true,
      },
    });
    if (!completion) return certificate;

    const payload = certificate.payload as {
      learnerName: string;
      courseTitle: string;
      verificationCode: string;
    };

    const renewalPeriod = await this.compliance.ensureRenewalPeriodForUser(completion.userId);

    const ceHours = this.ceuSync.resolveAuthoritativeCeuHours(
      completion.courseVersion.ceHours,
      completion.ceHoursEarned,
    );

    const courseTitle = payload.courseTitle ?? completion.courseVersion.course.title;

    await this.transcript.appendCompletionEntry({
      userId: completion.userId,
      completionId: completion.id,
      title: courseTitle,
      ceHours,
      completedOn: completion.completedAt,
      certificateId: certificate.id,
      certificateNo: certificate.certificateNo,
      verificationCode: payload.verificationCode,
      renewalPeriodId: renewalPeriod.id,
      renewalLabel: renewalPeriod.label,
      categorySlug: completion.courseVersion.course.category?.slug ?? null,
      deliveryMode: completion.courseVersion.deliveryMode,
    });

    return certificate;
  }

  private async backfillMissingTranscriptEntries(userId: string) {
    const issued = await this.prisma.certificate.findMany({
      where: { userId, status: CertificateStatus.ISSUED },
      include: {
        completion: {
          include: {
            courseVersion: { include: { course: { include: { category: true } } } },
          },
        },
      },
    });

    for (const cert of issued) {
      if (!cert.completion) continue;
      const payload = (cert.payload ?? {}) as {
        courseTitle?: string;
        verificationCode?: string;
      };
      const renewalPeriod = await this.compliance.ensureRenewalPeriodForUser(userId);
      const ceHours = this.ceuSync.resolveAuthoritativeCeuHours(
        cert.completion.courseVersion.ceHours,
        cert.completion.ceHoursEarned,
      );
      await this.transcript.appendCompletionEntry({
        userId,
        completionId: cert.completion.id,
        title: payload.courseTitle ?? cert.completion.courseVersion.course.title,
        ceHours,
        completedOn: cert.completion.completedAt,
        certificateId: cert.id,
        certificateNo: cert.certificateNo,
        verificationCode: payload.verificationCode ?? '',
        renewalPeriodId: renewalPeriod.id,
        renewalLabel: renewalPeriod.label,
        categorySlug: cert.completion.courseVersion.course.category?.slug ?? null,
        deliveryMode: cert.completion.courseVersion.deliveryMode,
      });
    }
  }
}
