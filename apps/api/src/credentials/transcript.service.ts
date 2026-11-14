import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  CertificateStatus,
  DeliveryMode,
  EnrollmentStatus,
  TranscriptEntryType,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { formatOnlineCeuHours } from '../config/ceu-defaults';
import { buildVerificationPageUrl } from './certificate-verification.types';
import { CERTIFICATE_EXPORT_PLACEHOLDERS } from './credentials.constants';
import { CertificateCeuSyncService } from './certificate-ceu-sync.service';
import { CredentialsOrchestratorService } from './credentials-orchestrator.service';

/** Enrollment-based academic transcript row (mirrors apps/web academic-transcript query). */
export type AcademicTranscriptEnrollmentDto = {
  id: string;
  courseTitle: string;
  /** ISO DateTime — enrollment.completedAt ?? enrolledAt */
  completedAt: string;
  ceHours: number;
  certificateId: string | null;
};

export type TranscriptListQuery = {
  q?: string;
  renewalPeriodId?: string;
  entryType?: TranscriptEntryType;
  from?: string;
  to?: string;
};

@Injectable()
export class TranscriptService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CredentialsOrchestratorService))
    private readonly orchestrator: CredentialsOrchestratorService,
    private readonly ceuSync: CertificateCeuSyncService,
  ) {}

  /**
   * Completed enrollments for the learner academic transcript page.
   * Mirrors the former web Prisma query in academic-transcript.ts exactly
   * (population, fields, order) — distinct from the TranscriptEntry ledger.
   */
  async listCompletedEnrollmentsForUser(
    user: AuthUser,
  ): Promise<AcademicTranscriptEnrollmentDto[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
        status: EnrollmentStatus.COMPLETED,
      },
      include: {
        courseVersion: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
        completions: {
          select: {
            certificate: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return rows.map((row) => {
      const issuedCertificate = row.completions.find(
        (completion) => completion.certificate?.status === CertificateStatus.ISSUED,
      )?.certificate;

      const completedAt = row.completedAt ?? row.enrolledAt;

      return {
        id: row.id,
        courseTitle: row.courseVersion.course.title,
        completedAt: completedAt.toISOString(),
        ceHours: Number(row.courseVersion.ceHours),
        certificateId: issuedCertificate?.id ?? null,
      };
    });
  }

  /**
   * Immutable ledger entries — create-only via completion issuance; no update/delete APIs.
   */
  async listForUser(user: AuthUser, query: TranscriptListQuery = {}) {
    await this.orchestrator.syncPendingCompletions(user);
    await this.ceuSync.syncStaleCertificatesForUser(user.userId);

    const entries = await this.prisma.transcriptEntry.findMany({
      where: { userId: user.userId },
      include: {
        completion: {
          include: {
            certificate: true,
            courseVersion: {
              include: { course: { include: { category: true } } },
            },
          },
        },
      },
      orderBy: { completedOn: 'desc' },
    });

    let filtered = entries;

    if (query.q?.trim()) {
      const q = query.q.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.sourceRef?.toLowerCase().includes(q) ?? false) ||
          String((e.metadata as { certificateNo?: string })?.certificateNo ?? '')
            .toLowerCase()
            .includes(q),
      );
    }

    if (query.entryType) {
      filtered = filtered.filter((e) => e.entryType === query.entryType);
    }

    if (query.renewalPeriodId) {
      filtered = filtered.filter(
        (e) =>
          (e.metadata as { renewalPeriodId?: string })?.renewalPeriodId ===
          query.renewalPeriodId,
      );
    }

    if (query.from) {
      const from = new Date(query.from);
      filtered = filtered.filter((e) => e.completedOn >= from);
    }

    if (query.to) {
      const to = new Date(query.to);
      filtered = filtered.filter((e) => e.completedOn <= to);
    }

    const totalCeHours = filtered.reduce((sum, e) => sum + Number(e.ceHours), 0);

    const byRenewal = this.groupByRenewalPeriod(filtered);

    return {
      entries: filtered.map((e) => this.toEntryDto(e)),
      totalCeHours,
      count: filtered.length,
      groupedByRenewalPeriod: byRenewal,
      download: CERTIFICATE_EXPORT_PLACEHOLDERS.download,
      immutableNotice:
        'Transcript entries are append-only. Corrections require an admin adjustment entry (future workflow).',
    };
  }

  async appendCompletionEntry(params: {
    userId: string;
    completionId: string;
    title: string;
    ceHours: number;
    completedOn: Date;
    certificateId: string;
    certificateNo: string;
    verificationCode: string;
    renewalPeriodId?: string;
    renewalLabel?: string;
    categorySlug?: string | null;
    deliveryMode: DeliveryMode;
  }): Promise<{ id: string }> {
    const existing = await this.prisma.transcriptEntry.findFirst({
      where: { completionId: params.completionId, entryType: TranscriptEntryType.COMPLETION },
    });
    if (existing) {
      if (Number(existing.ceHours) !== params.ceHours) {
        await this.ceuSync.syncCompletionCeuHours(params.completionId);
        const refreshed = await this.prisma.transcriptEntry.findFirst({
          where: { id: existing.id },
        });
        return refreshed ?? existing;
      }
      return existing;
    }

    return this.prisma.transcriptEntry.create({
      data: {
        userId: params.userId,
        completionId: params.completionId,
        entryType: TranscriptEntryType.COMPLETION,
        title: params.title,
        ceHours: params.ceHours,
        deliveryMode: params.deliveryMode,
        completedOn: params.completedOn,
        sourceRef: params.certificateNo,
        metadata: {
          immutable: true,
          certificateId: params.certificateId,
          certificateNo: params.certificateNo,
          verificationCode: params.verificationCode,
          renewalPeriodId: params.renewalPeriodId ?? null,
          renewalLabel: params.renewalLabel ?? null,
          categorySlug: params.categorySlug ?? null,
        },
      },
    });
  }

  private groupByRenewalPeriod(
    entries: Awaited<ReturnType<typeof this.prisma.transcriptEntry.findMany>>,
  ) {
    const groups = new Map<
      string,
      { renewalPeriodId: string; label: string; entries: typeof entries; totalCeHours: number }
    >();

    for (const entry of entries) {
      const dto = this.toEntryDto(entry);
      const meta = entry.metadata as { renewalPeriodId?: string; renewalLabel?: string };
      const key = meta.renewalPeriodId ?? 'unassigned';
      const label = meta.renewalLabel ?? (key === 'unassigned' ? 'Unassigned period' : key);
      if (!groups.has(key)) {
        groups.set(key, { renewalPeriodId: key, label, entries: [], totalCeHours: 0 });
      }
      const g = groups.get(key)!;
      g.entries.push(entry);
      g.totalCeHours += dto.ceHours;
    }

    return [...groups.values()].map((g) => ({
      renewalPeriodId: g.renewalPeriodId,
      label: g.label,
      totalCeHours: g.totalCeHours,
      entryCount: g.entries.length,
      entries: g.entries.map((e) => this.toEntryDto(e)),
    }));
  }

  private toEntryDto(entry: {
    id: string;
    entryType: string;
    title: string;
    ceHours: unknown;
    completedOn: Date;
    sourceRef: string | null;
    metadata: unknown;
    createdAt: Date;
    completion?: {
      ceHoursEarned?: unknown;
      courseVersion?: { ceHours?: unknown; course?: { slug?: string } };
    } | null;
  }) {
    const meta = (entry.metadata ?? {}) as Record<string, unknown>;
    const authoritative = this.ceuSync.resolveAuthoritativeCeuHours(
      entry.completion?.courseVersion?.ceHours,
      entry.ceHours ?? entry.completion?.ceHoursEarned,
    );
    const certificateNo = meta.certificateNo as string | undefined;
    const webBase =
      process.env.WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const verificationAvailable = Boolean(certificateNo);
    return {
      id: entry.id,
      entryType: entry.entryType,
      title: entry.title,
      ceHours: authoritative,
      onlineCeuHoursLabel: formatOnlineCeuHours(authoritative),
      completedOn: entry.completedOn.toISOString().slice(0, 10),
      sourceRef: entry.sourceRef,
      certificateId: meta.certificateId as string | undefined,
      certificateNo,
      verificationCode: meta.verificationCode as string | undefined,
      verificationAvailable,
      verificationUrl: certificateNo
        ? buildVerificationPageUrl(certificateNo, webBase)
        : undefined,
      renewalPeriodId: meta.renewalPeriodId as string | undefined,
      categorySlug: meta.categorySlug as string | undefined,
      courseSlug: entry.completion?.courseVersion?.course?.slug ?? null,
      createdAt: entry.createdAt.toISOString(),
      immutable: true,
    };
  }
}
