import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AuditAction,
  CourseStatus,
  CourseVersionStatus,
  Prisma,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { AuditService } from '../audit/audit.service';
import { DEFAULT_TENANT_SLUG } from '../config/auth.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CDPH_ONLINE_CEU, requiredSeatTimeMinutes } from './participation.constants';
import type { ParticipationHeartbeatDto } from './dto/participation-heartbeat.dto';
import { ParticipationEnforcementService } from './participation-enforcement.service';
import { ParticipationLedgerService } from './participation-ledger.service';
import type {
  HeartbeatResult,
  ParticipationComplianceStatus,
  ParticipationLedgerV1,
} from './participation.types';

@Injectable()
export class ParticipationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: ParticipationLedgerService,
    private readonly enforcement: ParticipationEnforcementService,
    private readonly audit: AuditService,
  ) {}

  async getComplianceStatus(
    user: AuthUser,
    courseSlug: string,
    options?: { examGates?: boolean },
  ): Promise<ParticipationComplianceStatus> {
    const { enrollment, ceHours } = await this.resolveEnrollment(user, courseSlug);
    return this.buildStatus(enrollment.id, ceHours, enrollment.metadata, options);
  }

  async getStatusForEnrollment(
    enrollmentId: string,
    ceHours: number,
    metadata: unknown,
  ): Promise<ParticipationComplianceStatus> {
    return this.buildStatus(enrollmentId, ceHours, metadata);
  }

  async processHeartbeat(
    user: AuthUser,
    courseSlug: string,
    dto: ParticipationHeartbeatDto,
  ): Promise<HeartbeatResult & { compliance: ParticipationComplianceStatus }> {
    const { enrollment, ceHours } = await this.resolveEnrollment(user, courseSlug);
    const meta = (enrollment.metadata ?? {}) as Record<string, unknown>;
    let ledger = this.ledgerService.fromEnrollmentMetadata(meta);

    const { ledger: updated, result } = this.enforcement.processHeartbeat(ledger, dto);
    ledger = updated;

    await this.persistLedger(enrollment.id, meta, ledger);

    if (result.creditedSeconds > 0) {
      await this.audit.log({
        tenantId: enrollment.tenantId,
        actorId: user.userId,
        action: AuditAction.UPDATE,
        entityType: 'participation_heartbeat',
        entityId: enrollment.id,
        metadata: {
          courseSlug,
          creditedSeconds: result.creditedSeconds,
          activeSeconds: ledger.activeSeconds,
        },
      });
    }

    const compliance = this.buildStatusFromLedger(
      enrollment.id,
      ceHours,
      ledger,
      meta,
    );

    return {
      ...result,
      requiredMinutes: compliance.requiredMinutes,
      seatTimeMet: compliance.seatTimeMet,
      compliance,
    };
  }

  /** DEV ONLY: injects full required seat-time into the ledger so the loop can be tested without waiting 50 minutes. Never runs in production. */
  async devFastForwardSeatTime(
    user: AuthUser,
    courseSlug: string,
  ): Promise<ParticipationComplianceStatus> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev fast-forward is disabled in production.');
    }

    const { enrollment, ceHours } = await this.resolveEnrollment(user, courseSlug);
    const meta = (enrollment.metadata ?? {}) as Record<string, unknown>;
    let ledger = this.ledgerService.fromEnrollmentMetadata(meta);

    const requiredSeconds = requiredSeatTimeMinutes(ceHours) * 60;
    ledger = {
      ...ledger,
      activeSeconds: requiredSeconds,
      interactionCount: Math.max(ledger.interactionCount, 1),
      lastActiveAt: new Date().toISOString(),
      pausedSince: null,
    };
    ledger = this.ledgerService.syncSeatTimeMinutes(ledger);

    await this.persistLedger(enrollment.id, meta, ledger);

    await this.audit.log({
      tenantId: enrollment.tenantId,
      actorId: user.userId,
      action: AuditAction.UPDATE,
      entityType: 'participation_dev_fast_forward',
      entityId: enrollment.id,
      metadata: { courseSlug, injectedSeconds: requiredSeconds },
    });

    return this.buildStatusFromLedger(enrollment.id, ceHours, ledger, meta);
  }

  async recordInteractionEvidence(
    enrollmentId: string,
    type: 'lesson_view' | 'block_progress' | 'quiz_activity',
    lessonId?: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) return;

    const enrollmentMeta = (enrollment.metadata ?? {}) as Record<string, unknown>;
    let ledger = this.ledgerService.fromEnrollmentMetadata(enrollmentMeta);
    ledger = this.enforcement.recordInteractionEvidence(ledger, type, lessonId, meta);
    await this.persistLedger(enrollmentId, enrollmentMeta, ledger);
  }

  /** Legacy snapshot shape for assessments module compatibility */
  async getSeatTimeSnapshot(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { courseVersion: true },
    });
    if (!enrollment) {
      return {
        seatTimeMinutes: 0,
        requiredMinutes: 0,
        satisfied: false,
        lastActivityAt: null,
        deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
      };
    }

    const status = this.buildStatusFromLedger(
      enrollmentId,
      Number(enrollment.courseVersion.ceHours),
      this.ledgerService.fromEnrollmentMetadata(
        (enrollment.metadata ?? {}) as Record<string, unknown>,
      ),
      enrollment.metadata as Record<string, unknown>,
    );

    return {
      seatTimeMinutes: status.activeMinutes,
      requiredMinutes: status.requiredMinutes,
      satisfied: status.seatTimeMet,
      lastActivityAt: status.lastActiveAt,
      deliveryMode: status.deliveryMode,
    };
  }

  getLedgerFromMetadata(metadata: unknown): ParticipationLedgerV1 {
    return this.ledgerService.fromEnrollmentMetadata(
      (metadata ?? {}) as Record<string, unknown>,
    );
  }

  getActiveMinutesFromMetadata(metadata: unknown, ceHours: number): number {
    const ledger = this.getLedgerFromMetadata(metadata);
    const requiredSec = requiredSeatTimeMinutes(ceHours) * 60;
    return Math.min(Math.floor(ledger.activeSeconds / 60), requiredSeatTimeMinutes(ceHours));
  }

  isSeatTimeMet(metadata: unknown, ceHours: number): boolean {
    const ledger = this.getLedgerFromMetadata(metadata);
    return ledger.activeSeconds >= requiredSeatTimeMinutes(ceHours) * 60;
  }

  private async buildStatus(
    enrollmentId: string,
    ceHours: number,
    metadata: unknown,
    options?: { examGates?: boolean },
  ): Promise<ParticipationComplianceStatus> {
    const ledger = this.ledgerService.fromEnrollmentMetadata(
      (metadata ?? {}) as Record<string, unknown>,
    );
    return this.buildStatusFromLedger(enrollmentId, ceHours, ledger, metadata, options);
  }

  private buildStatusFromLedger(
    enrollmentId: string,
    ceHours: number,
    ledger: ParticipationLedgerV1,
    metadata: unknown,
    _options?: { examGates?: boolean },
  ): ParticipationComplianceStatus {
    const requiredMinutes = requiredSeatTimeMinutes(ceHours);
    const requiredSeconds = requiredMinutes * 60;
    const activeSeconds = ledger.activeSeconds;
    const activeMinutes = Math.floor(activeSeconds / 60);
    const remainingSeconds = Math.max(0, requiredSeconds - activeSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const percentComplete =
      requiredSeconds > 0
        ? Math.min(100, Math.round((activeSeconds / requiredSeconds) * 100))
        : 100;
    const seatTimeMet = activeSeconds >= requiredSeconds;
    const isPaused = Boolean(ledger.pausedSince);

    const meta = (metadata ?? {}) as Record<string, unknown>;
    const attestationAt = meta.certificateAttestationAt;

    const reasons: string[] = [];
    if (!seatTimeMet) {
      reasons.push(
        `Active participation: ${activeMinutes} of ${requiredMinutes} minutes (${CDPH_ONLINE_CEU.minutesPerCeuHour} min per CEU hour).`,
      );
    }
    if (ledger.interactionCount < 1) {
      reasons.push('Complete interactive lesson activities to demonstrate participation.');
    }

    return {
      activeSeconds,
      activeMinutes,
      requiredMinutes,
      requiredSeconds,
      remainingMinutes,
      remainingSeconds,
      percentComplete,
      seatTimeMet,
      interactionCount: ledger.interactionCount,
      isPaused,
      lastActiveAt: ledger.lastActiveAt,
      examEligible: seatTimeMet && ledger.interactionCount > 0,
      certificateEligible: seatTimeMet && Boolean(attestationAt),
      deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
      minutesPerCeuHour: CDPH_ONLINE_CEU.minutesPerCeuHour,
      reasons,
      ledgerSummary: {
        sessionId: ledger.sessionId,
        recentEventCount: ledger.events.length,
        lastHeartbeatAt: ledger.lastHeartbeatAt,
      },
    };
  }

  private async persistLedger(
    enrollmentId: string,
    meta: Record<string, unknown>,
    ledger: ParticipationLedgerV1,
  ) {
    const participation = this.ledgerService.toEnrollmentParticipation(ledger);
    const metadata = {
      ...meta,
      participation,
    } as Prisma.InputJsonValue;
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        metadata,
        activeParticipationSeconds: ledger.activeSeconds,
      },
    });
  }

  private async resolveEnrollment(user: AuthUser, courseSlug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: DEFAULT_TENANT_SLUG, deletedAt: null },
    });
    if (!tenant) throw new Error('Tenant not configured');

    const course = await this.prisma.course.findFirst({
      where: {
        tenantId: tenant.id,
        slug: courseSlug,
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        versions: {
          where: { status: CourseVersionStatus.PUBLISHED, deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    const version = course?.versions[0];
    if (!version) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: user.userId,
        courseVersionId: version.id,
        deletedAt: null,
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment required');

    return {
      enrollment,
      ceHours: Number(version.ceHours),
    };
  }
}
