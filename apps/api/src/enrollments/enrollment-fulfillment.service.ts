import { Injectable, Logger } from '@nestjs/common';
import { CertificateStatus, Prisma } from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { ROLE_SLUG } from '../config/auth.constants';
import { AssessmentService } from '../assessments/assessment.service';
import { CompletionEligibilityService } from '../assessments/completion-eligibility.service';
import { CredentialsOrchestratorService } from '../credentials/credentials-orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';
import { markEnrollmentRequiresRepurchase } from './enrollment-attempt.util';
import type {
  EnrollmentFulfillmentInput,
  EnrollmentFulfillmentResult,
  EnrollmentFulfillmentStatus,
  OrderFulfillmentMeta,
} from './enrollment-fulfillment.types';

@Injectable()
export class EnrollmentFulfillmentService {
  private readonly logger = new Logger(EnrollmentFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assessments: AssessmentService,
    private readonly eligibility: CompletionEligibilityService,
    private readonly credentials: CredentialsOrchestratorService,
  ) {}

  async markRequiresRepurchase(enrollmentId: string, _courseSlug: string) {
    await markEnrollmentRequiresRepurchase(this.prisma, enrollmentId);
    this.logger.log(`Enrollment ${enrollmentId} marked requires reset`);
  }

  async fulfillEnrollmentCredentials(
    input: EnrollmentFulfillmentInput,
  ): Promise<EnrollmentFulfillmentResult> {
    const authUser = await this.resolveAuthUser(input.userId, input.tenantId);
    let completionId: string | undefined;
    let certificateId: string | undefined;
    let certificateNo: string | undefined;
    let complianceComplete = false;
    let certificatePending = false;
    let fulfillmentError: string | undefined;

    try {
      await this.credentials.syncPendingCompletions({ userId: input.userId });

      const issued = await this.resolveIssuedCertificate(input.enrollmentId);
      if (issued) {
        completionId = issued.completionId;
        certificateId = issued.certificateId;
        certificateNo = issued.certificateNo;
        complianceComplete = true;
      } else {
        const eligibility = await this.eligibility.evaluate(authUser, input.enrollmentId);

        if (eligibility.eligible) {
          const finalized = await this.assessments.tryFinalizeCourseCompletion(
            authUser,
            input.enrollmentId,
          );
          if (finalized.finalized) {
            const issuedAfterFinalize = await this.resolveIssuedCertificate(input.enrollmentId);
            if (issuedAfterFinalize) {
              completionId = issuedAfterFinalize.completionId;
              certificateId = issuedAfterFinalize.certificateId;
              certificateNo = issuedAfterFinalize.certificateNo;
              complianceComplete = true;
            } else {
              certificatePending = true;
              fulfillmentError =
                'Course completion finalized but certificate issuance did not complete.';
            }
          }
        } else {
          const pendingCompletion = await this.findPendingCompletion(input.enrollmentId);
          if (pendingCompletion) {
            const certificate = await this.credentials.processCompletion(
              pendingCompletion.id,
              input.userId,
            );
            if (certificate) {
              const issued = await this.resolveIssuedCertificate(input.enrollmentId);
              completionId = pendingCompletion.id;
              certificateId = issued?.certificateId ?? certificate.id;
              certificateNo = issued?.certificateNo;
              complianceComplete = true;
            } else {
              certificatePending = true;
              fulfillmentError =
                'Completion exists but certificate could not be issued (seat time or compliance gate).';
            }
          }
        }
      }
    } catch (err) {
      certificatePending = true;
      fulfillmentError = err instanceof Error ? err.message : 'Enrollment fulfillment failed';
      this.logger.error(
        `Credential fulfillment failed for enrollment ${input.enrollmentId}: ${fulfillmentError}`,
      );
    }

    const status: EnrollmentFulfillmentStatus = complianceComplete
      ? 'compliance_complete'
      : certificatePending
        ? 'certificate_pending'
        : 'enrolled';

    const note = this.buildFulfillmentNote(status, fulfillmentError);

    if (input.orderId) {
      await this.persistOrderFulfillmentMeta(input.orderId, {
        enrollmentId: input.enrollmentId,
        fulfillmentStatus: status,
        completionId,
        certificateId,
        certificateNo,
        complianceComplete,
        certificatePending,
        fulfillmentError,
        fulfilledAt: new Date().toISOString(),
        // fulfillmentRetryAt written for observability only.
        // No automated retry consumer exists — tracked for pre-launch.
        // Retry currently depends on Stripe webhook replay.
        fulfillmentRetryAt: certificatePending
          ? new Date(Date.now() + 15 * 60_000).toISOString()
          : undefined,
        planType: input.planType,
        courseSlug: input.courseSlug,
        activationSource: input.activationSource,
      });
    }

    await this.persistEnrollmentFulfillmentMeta(input.enrollmentId, {
      fulfillmentStatus: status,
      certificateId,
      completionId,
      certificatePending,
      fulfillmentError,
      activationSource: input.activationSource,
      planType: input.planType,
      fulfilledAt: new Date().toISOString(),
    });

    return {
      status,
      enrollmentId: input.enrollmentId,
      completionId,
      certificateId,
      certificateNo,
      complianceComplete,
      certificatePending,
      fulfillmentError,
      note,
    };
  }

  private async resolveAuthUser(userId: string, tenantId: string): Promise<AuthUser> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true, firstName: true, lastName: true },
    });
    if (!dbUser) {
      throw new Error('User not found for enrollment fulfillment');
    }

    return {
      sub: userId,
      userId,
      email: dbUser.email,
      tenantId,
      roles: [ROLE_SLUG.LEARNER],
      emailVerified: Boolean(dbUser.emailVerifiedAt),
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
    };
  }

  private async resolveIssuedCertificate(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        completions: {
          include: {
            certificate: true,
            transcriptEntries: true,
          },
        },
      },
    });

    const completion = enrollment?.completions[0];
    if (!completion?.certificate || completion.certificate.status !== CertificateStatus.ISSUED) {
      return null;
    }

    return {
      completionId: completion.id,
      certificateId: completion.certificate.id,
      certificateNo: completion.certificate.certificateNo,
    };
  }

  private async findPendingCompletion(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        completions: {
          include: { certificate: true },
        },
      },
    });

    const completion = enrollment?.completions[0];
    if (!completion) return null;
    if (completion.certificate?.status === CertificateStatus.ISSUED) return null;
    return completion;
  }

  private async persistOrderFulfillmentMeta(orderId: string, meta: OrderFulfillmentMeta) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentMeta: true },
    });
    if (!order) return;

    const existing = (order.paymentMeta ?? {}) as Record<string, unknown>;
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMeta: {
          ...existing,
          ...meta,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async persistEnrollmentFulfillmentMeta(
    enrollmentId: string,
    fulfillment: Record<string, unknown>,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { metadata: true },
    });
    if (!enrollment) return;

    const meta = (enrollment.metadata ?? {}) as Record<string, unknown>;
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        metadata: {
          ...meta,
          fulfillment,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private buildFulfillmentNote(
    status: EnrollmentFulfillmentStatus,
    fulfillmentError?: string,
  ): string {
    switch (status) {
      case 'compliance_complete':
        return 'Enrollment activated with issued certificate and transcript entry.';
      case 'certificate_pending':
        return (
          fulfillmentError ??
          'Enrollment recorded. Certificate generation is pending and will be retried.'
        );
      case 'requires_repurchase':
        return 'Course attempt limit reached. Purchase this course again to continue.';
      default:
        return 'Enrollment activated. Complete course requirements to release your certificate.';
    }
  }
}
