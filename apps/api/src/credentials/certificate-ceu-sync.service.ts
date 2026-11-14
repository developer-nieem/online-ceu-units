import { Injectable, Logger } from '@nestjs/common';
import { CertificateStatus, TranscriptEntryType } from '@calace/db';

import { formatOnlineCeuHours } from '../config/ceu-defaults';
import { PrismaService } from '../prisma/prisma.service';
import type { CertificatePayload } from './certificate.service';

/** Production-issued certificates can set payload.immutable or metadata.productionLocked. */
export function isCertificateProductionLocked(
  payload: Record<string, unknown>,
  certificateMetadata?: unknown,
): boolean {
  if (payload.immutable === true) return true;
  const meta = (certificateMetadata ?? {}) as Record<string, unknown>;
  return meta.productionLocked === true;
}

/** Development and pre-production corrections; disabled in production unless explicitly allowed. */
export function allowCeuCorrection(
  payload?: Record<string, unknown>,
  certificateMetadata?: unknown,
): boolean {
  if (process.env.ALLOW_CEU_CORRECTION === 'true') return true;
  if (process.env.NODE_ENV === 'production') return false;
  if (payload && isCertificateProductionLocked(payload, certificateMetadata)) return false;
  return true;
}

@Injectable()
export class CertificateCeuSyncService {
  private readonly logger = new Logger(CertificateCeuSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  resolveAuthoritativeCeuHours(courseVersionCeHours: unknown, fallback?: unknown): number {
    const fromVersion = Number(courseVersionCeHours);
    if (Number.isFinite(fromVersion) && fromVersion > 0) return fromVersion;
    const fb = Number(fallback ?? 0);
    return Number.isFinite(fb) ? fb : 0;
  }

  applyHoursToPayload(
    payload: CertificatePayload,
    ceuHours: number,
  ): CertificatePayload {
    return {
      ...payload,
      ceuHours,
      onlineCeuHours: ceuHours,
      onlineCeuHoursLabel: formatOnlineCeuHours(ceuHours),
    };
  }

  /**
   * Align completion, certificate payload, and transcript with courseVersion.ceHours.
   * Skips production-locked certificates unless ALLOW_CEU_CORRECTION=true.
   */
  async syncCompletionCeuHours(completionId: string): Promise<{ updated: boolean; ceuHours: number }> {
    const completion = await this.prisma.completion.findUnique({
      where: { id: completionId },
      include: {
        courseVersion: { include: { course: true } },
        certificate: true,
        transcriptEntries: {
          where: { entryType: TranscriptEntryType.COMPLETION },
        },
      },
    });

    if (!completion) return { updated: false, ceuHours: 0 };

    const authoritative = this.resolveAuthoritativeCeuHours(
      completion.courseVersion.ceHours,
      completion.ceHoursEarned,
    );

    const cert = completion.certificate;
    const payload = (cert?.payload ?? {}) as CertificatePayload & Record<string, unknown>;
    const storedHours = Number(payload.ceuHours ?? payload.onlineCeuHours ?? 0);
    const completionHours = Number(completion.ceHoursEarned);
    const needsCompletion = completionHours !== authoritative;
    const needsCert =
      cert?.status === CertificateStatus.ISSUED &&
      storedHours !== authoritative;
    const needsTranscript = completion.transcriptEntries.some(
      (e) => Number(e.ceHours) !== authoritative,
    );

    if (!needsCompletion && !needsCert && !needsTranscript) {
      return { updated: false, ceuHours: authoritative };
    }

    const certLocked =
      needsCert && cert != null && !allowCeuCorrection(payload, cert);
    if (certLocked) {
      this.logger.warn(
        `Skipping certificate payload CE correction for locked certificate ${cert!.id} (completion ${completionId})`,
      );
    }

    const now = new Date().toISOString();

    if (needsCompletion) {
      await this.prisma.completion.update({
        where: { id: completionId },
        data: {
          ceHoursEarned: authoritative,
          metadata: {
            ...(completion.metadata as object),
            ceuHoursCorrectedAt: now,
            ceuHoursSource: 'course_version',
          },
        },
      });
    }

    if (cert?.status === CertificateStatus.ISSUED && needsCert && !certLocked) {
      const nextPayload = this.applyHoursToPayload(
        payload as CertificatePayload,
        authoritative,
      );
      (nextPayload as Record<string, unknown>).ceuCorrection = {
        correctedAt: now,
        previousCeuHours: storedHours,
        reason: 'course_version_sync',
      };

      await this.prisma.certificate.update({
        where: { id: cert.id },
        data: { payload: nextPayload },
      });
    }

    let transcriptUpdated = false;
    for (const entry of completion.transcriptEntries) {
      if (Number(entry.ceHours) === authoritative) continue;
      if (!allowCeuCorrection(payload, cert)) continue;

      await this.prisma.transcriptEntry.update({
        where: { id: entry.id },
        data: {
          ceHours: authoritative,
          metadata: {
            ...(entry.metadata as object),
            ceuHoursCorrectedAt: now,
            previousCeHours: Number(entry.ceHours),
          },
        },
      });
      transcriptUpdated = true;
    }

    return {
      updated:
        needsCompletion ||
        (needsCert && !certLocked) ||
        transcriptUpdated,
      ceuHours: authoritative,
    };
  }

  async syncStaleCertificatesForUser(userId: string): Promise<number> {
    if (!allowCeuCorrection()) return 0;

    const completions = await this.prisma.completion.findMany({
      where: { userId },
      include: {
        courseVersion: true,
        certificate: { where: { status: CertificateStatus.ISSUED } },
      },
    });

    let count = 0;
    for (const c of completions) {
      const authoritative = this.resolveAuthoritativeCeuHours(
        c.courseVersion.ceHours,
        c.ceHoursEarned,
      );
      const payload = (c.certificate?.payload ?? {}) as CertificatePayload;
      const stored = Number(payload.ceuHours ?? 0);
      if (
        Number(c.ceHoursEarned) !== authoritative ||
        (c.certificate && stored !== authoritative)
      ) {
        const result = await this.syncCompletionCeuHours(c.id);
        if (result.updated) count += 1;
      }
    }
    return count;
  }

  /** Backfill all completions where stored hours differ from course version (dev/seed). */
  async backfillAllStaleFromCourseVersions(): Promise<{ corrected: number }> {
    const completions = await this.prisma.completion.findMany({
      include: { courseVersion: true, certificate: true },
    });

    let corrected = 0;
    for (const c of completions) {
      const authoritative = this.resolveAuthoritativeCeuHours(
        c.courseVersion.ceHours,
        c.ceHoursEarned,
      );
      if (Number(c.ceHoursEarned) !== authoritative) {
        const r = await this.syncCompletionCeuHours(c.id);
        if (r.updated) corrected += 1;
      } else if (c.certificate) {
        const payload = (c.certificate.payload ?? {}) as CertificatePayload;
        if (Number(payload.ceuHours ?? 0) !== authoritative) {
          const r = await this.syncCompletionCeuHours(c.id);
          if (r.updated) corrected += 1;
        }
      }
    }
    return { corrected };
  }
}
