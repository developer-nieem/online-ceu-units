import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  ComplianceSnapshotStatus,
  RenewalPeriodStatus,
  TranscriptEntryType,
} from '@calace/db';

import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';
import { CA_CNA_COMPLIANCE } from './credentials.constants';
import { CertificateCeuSyncService } from './certificate-ceu-sync.service';
import { CredentialsOrchestratorService } from './credentials-orchestrator.service';

type LearnerProfileContext = {
  licenseExpiresOn: Date | null;
  licenseEffectiveOn: Date | null;
  birthMonth: number | null;
  birthDay: number | null;
  jurisdictionId: string | null;
  profession?: { code: string } | null;
} | null;

type TranscriptEntryWithCompletion = {
  ceHours: { toString(): string };
  deliveryMode?: string | null;
  metadata: unknown;
  completion?: {
    courseVersion?: { ceHours?: unknown; deliveryMode?: string | null } | null;
  } | null;
};

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CredentialsOrchestratorService))
    private readonly orchestrator: CredentialsOrchestratorService,
    private readonly ceuSync: CertificateCeuSyncService,
    private readonly providerSettings: ProviderComplianceSettingsService,
  ) {}

  async getSummary(user: AuthUser) {
    return this.getSummaryForUser(user.userId, user.tenantId);
  }

  async getSummaryForUser(userId: string, tenantId: string) {
    await this.orchestrator.syncPendingCompletions({ userId });
    await this.ceuSync.syncStaleCertificatesForUser(userId);

    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
      select: {
        licenseExpiresOn: true,
        licenseEffectiveOn: true,
        birthMonth: true,
        birthDay: true,
        jurisdictionId: true,
        professionId: true,
        jurisdiction: true,
        profession: true,
      },
    });

    const ruleSet = await this.prisma.complianceRuleSet.findFirst({
      where: {
        ...(profile?.jurisdictionId ? { jurisdictionId: profile.jurisdictionId } : {}),
        ...(profile?.professionId ? { professionId: profile.professionId } : {}),
        deletedAt: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    const rules = (ruleSet?.rules ?? {
      renewalPeriodMonths: CA_CNA_COMPLIANCE.renewalPeriodMonths,
      requiredCeHours: CA_CNA_COMPLIANCE.requiredCeHours,
      mandatoryTopics: [...CA_CNA_COMPLIANCE.mandatoryTopicSlugs],
    }) as {
      renewalPeriodMonths?: number;
      requiredCeHours?: number;
      mandatoryTopics?: string[];
      minHoursPerYear?: number;
      maxOnlineHours?: number;
    };

    const professionCode = profile?.profession?.code ?? 'CNA';
    const isProfessionHHA = professionCode === 'HHA';
    const professionDefaults = isProfessionHHA
      ? {
          maxOnlineHours: 0,
          requiredCeHours: 24,
          minHoursPerYear: 12,
          renewalPeriodMonths: 24,
        }
      : {
          maxOnlineHours: 24,
          requiredCeHours: 48,
          minHoursPerYear: 12,
          renewalPeriodMonths: 24,
        };

    const requiredHours = Number(
      rules.requiredCeHours ?? professionDefaults.requiredCeHours
    );
    const minHoursPerYear = Number(
      rules.minHoursPerYear ?? professionDefaults.minHoursPerYear
    );
    const maxOnlineHours = Number(
      rules.maxOnlineHours ?? professionDefaults.maxOnlineHours
    );
    const renewalPeriodMonths = Number(
      rules.renewalPeriodMonths ?? professionDefaults.renewalPeriodMonths,
    );
    const tenantProvider = await this.providerSettings.getForTenant(tenantId);
    const renewalPeriod = await this.ensureActiveRenewalPeriod(
      userId,
      requiredHours,
      profile,
      tenantProvider.nacProviderReference,
      renewalPeriodMonths,
    );

    const jurisdictionId =
      profile?.jurisdictionId ??
      (
        await this.prisma.jurisdiction.findFirst({
          where: { code: CA_CNA_COMPLIANCE.jurisdictionCode },
        })
      )?.id;

    if (!jurisdictionId) {
      throw new Error('Jurisdiction not configured for compliance tracking');
    }

    const periodMetadata = renewalPeriod.metadata as {
      year1End?: string;
    } | null;

    const year1End = periodMetadata?.year1End
      ? new Date(periodMetadata.year1End)
      : this.subtractOneYear(renewalPeriod.periodEnd);

    const year2Start = new Date(year1End);
    year2Start.setDate(year2Start.getDate() + 1);

    const entryInclude = {
      completion: { include: { courseVersion: true } },
    } as const;

    const periodEntries = await this.prisma.transcriptEntry.findMany({
      where: {
        userId,
        entryType: TranscriptEntryType.COMPLETION,
        completedOn: {
          gte: renewalPeriod.periodStart,
          lte: renewalPeriod.periodEnd,
        },
      },
      include: entryInclude,
    });

    const year1Entries = await this.prisma.transcriptEntry.findMany({
      where: {
        userId,
        entryType: TranscriptEntryType.COMPLETION,
        completedOn: {
          gte: renewalPeriod.periodStart,
          lte: year1End,
        },
      },
      include: entryInclude,
    });

    const year2Entries = await this.prisma.transcriptEntry.findMany({
      where: {
        userId,
        entryType: TranscriptEntryType.COMPLETION,
        completedOn: {
          gte: year2Start,
          lte: renewalPeriod.periodEnd,
        },
      },
      include: entryInclude,
    });

    const earnedHours = this.sumEntryHours(periodEntries);
    const year1Hours = this.sumEntryHours(year1Entries);
    const year2Hours = this.sumEntryHours(year2Entries);
    const year1Gap = Math.max(0, minHoursPerYear - year1Hours);
    const year2Gap = Math.max(0, minHoursPerYear - year2Hours);

    const onlineHours = periodEntries.reduce((s, e) => {
      const mode = this.resolveDeliveryMode(e);
      if (mode === 'ONLINE' || mode === 'BLENDED') {
        return s + this.resolveEntryHours(e);
      }
      return s;
    }, 0);
    const inPersonHours = earnedHours - onlineHours;
    const onlineCapExceeded = onlineHours > maxOnlineHours;
    const onlineHoursApplied = Math.min(onlineHours, maxOnlineHours);
    const effectiveHours = inPersonHours + onlineHoursApplied;

    const remainingHours = Math.max(0, requiredHours - effectiveHours);
    const pct = requiredHours > 0 ? Math.round((effectiveHours / requiredHours) * 100) : 0;

    const categoryBreakdown = this.buildCategoryBreakdown(periodEntries);
    const mandatoryTopics = rules.mandatoryTopics ?? [...CA_CNA_COMPLIANCE.mandatoryTopicSlugs];
    const topicWarnings = this.mandatoryTopicWarnings(mandatoryTopics, categoryBreakdown);

    if (profile?.licenseEffectiveOn && profile?.licenseExpiresOn) {
      const certSpanDays = Math.round(
        (profile.licenseExpiresOn.getTime() - profile.licenseEffectiveOn.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (certSpanDays > 853) {
        topicWarnings.push({
          topic: 'certification-period-span',
          severity: 'warning',
          message:
            'Your certification period spans more than 28 months, which is longer than a ' +
            'standard two-birthday cycle. Your effective date on file may be outdated — ' +
            'CDPH resets it after a late renewal. Verify your actual Year 1 start date ' +
            'directly with CDPH before relying on this calculation.',
        });
      }
    }

    const daysUntilExpiration = this.daysUntil(renewalPeriod.periodEnd);
    const status = this.resolveStatus(
      effectiveHours,
      requiredHours,
      year1Hours,
      year2Hours,
      minHoursPerYear,
      onlineCapExceeded,
      daysUntilExpiration,
      topicWarnings,
    );

    const providerDisplay = this.providerSettings.learnerProviderDisplay(tenantProvider);

    const snapshot = await this.prisma.complianceSnapshot.create({
      data: {
        userId,
        jurisdictionId,
        status,
        asOfDate: new Date(),
        requiredHours,
        earnedHours: effectiveHours,
        breakdown: {
          earnedHoursRaw: earnedHours,
          renewalPeriodId: renewalPeriod.id,
          categoryBreakdown,
          mandatoryTopics,
          topicWarnings,
          inServiceCategories: CA_CNA_COMPLIANCE.inServiceCategories,
          daysUntilExpiration,
          pctComplete: pct,
          year1Hours,
          year2Hours,
          year1Gap,
          year2Gap,
          onlineHours,
          inPersonHours,
          onlineCapExceeded,
          onlineHoursApplied,
          effectiveHours,
          maxOnlineHours,
          minHoursPerYear,
          year1End: year1End.toISOString().slice(0, 10),
          year2Start: year2Start.toISOString().slice(0, 10),
        },
        metadata: { ruleSetId: ruleSet?.id ?? null },
      },
    });

    await this.prisma.renewalPeriod.update({
      where: { id: renewalPeriod.id },
      data: { earnedHours: effectiveHours },
    });

    return {
      status,
      statusLabel: this.statusLabel(status),
      jurisdiction: {
        code: profile?.jurisdiction?.code ?? CA_CNA_COMPLIANCE.jurisdictionCode,
        name: profile?.jurisdiction?.name ?? CA_CNA_COMPLIANCE.jurisdictionLabel,
      },
      profession: {
        code: profile?.profession?.code ?? CA_CNA_COMPLIANCE.professionCode,
        name: profile?.profession?.name ?? CA_CNA_COMPLIANCE.professionLabel,
      },
      renewalPeriod: {
        id: renewalPeriod.id,
        label: renewalPeriod.label,
        status: renewalPeriod.status,
        periodStart: renewalPeriod.periodStart.toISOString().slice(0, 10),
        periodEnd: renewalPeriod.periodEnd.toISOString().slice(0, 10),
        requiredHours,
        earnedHours: effectiveHours,
        remainingHours,
        pctComplete: pct,
        daysUntilExpiration,
      },
      licenseExpiresOn: profile?.licenseExpiresOn?.toISOString().slice(0, 10) ?? null,
      mandatoryTopics,
      topicWarnings,
      inServiceCategories: CA_CNA_COMPLIANCE.inServiceCategories,
      categoryBreakdown,
      provider: providerDisplay,
      supportContact: tenantProvider.supportContactEmail || tenantProvider.supportContactUrl,
      snapshotId: snapshot.id,
      asOfDate: snapshot.asOfDate.toISOString().slice(0, 10),
      warnings: topicWarnings,
      yearSplit: {
        year1: {
          periodStart: renewalPeriod.periodStart.toISOString().slice(0, 10),
          periodEnd: year1End.toISOString().slice(0, 10),
          earnedHours: year1Hours,
          requiredHours: minHoursPerYear,
          met: year1Hours >= minHoursPerYear,
        },
        year2: {
          periodStart: year2Start.toISOString().slice(0, 10),
          periodEnd: renewalPeriod.periodEnd.toISOString().slice(0, 10),
          earnedHours: year2Hours,
          requiredHours: minHoursPerYear,
          met: year2Hours >= minHoursPerYear,
        },
      },
      onlineCap: {
        onlineHours,
        inPersonHours,
        maxOnlineHours,
        capExceeded: onlineCapExceeded,
        onlineHoursApplied,
        effectiveHours,
        honestyNote: onlineCapExceeded
          ? `You've earned ${earnedHours} hours; ${effectiveHours} count toward your ${requiredHours}. Online hours are capped at ${maxOnlineHours} — the remaining ${remainingHours} must come from in-person training.`
          : onlineHours >= maxOnlineHours
            ? `You have reached the ${maxOnlineHours}-hour online limit. Remaining hours must come from in-person training.`
            : `You have used ${onlineHours} of your ${maxOnlineHours} allowed online hours.`,
      },
    };
  }

  async ensureRenewalPeriodForUser(
    userId: string,
  ): Promise<{ id: string; label: string }> {
    const dbUser = await this.prisma.user.findUnique({ where: { id: userId } });
    const tenantProvider = await this.providerSettings.getForTenant(dbUser?.tenantId);
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
      select: {
        licenseExpiresOn: true,
        licenseEffectiveOn: true,
        birthMonth: true,
        birthDay: true,
        jurisdictionId: true,
        professionId: true,
        profession: true,
      },
    });
    const ruleSet = await this.prisma.complianceRuleSet.findFirst({
      where: {
        ...(profile?.jurisdictionId ? { jurisdictionId: profile.jurisdictionId } : {}),
        ...(profile?.professionId ? { professionId: profile.professionId } : {}),
        deletedAt: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    const rules = (ruleSet?.rules ?? {}) as {
      requiredCeHours?: number;
      renewalPeriodMonths?: number;
    };
    const professionCode = profile?.profession?.code ?? 'CNA';
    const isProfessionHHA = professionCode === 'HHA';
    const professionDefaults = isProfessionHHA
      ? {
          maxOnlineHours: 0,
          requiredCeHours: 24,
          minHoursPerYear: 12,
          renewalPeriodMonths: 24,
        }
      : {
          maxOnlineHours: 24,
          requiredCeHours: 48,
          minHoursPerYear: 12,
          renewalPeriodMonths: 24,
        };
    const requiredHours = Number(
      rules.requiredCeHours ?? professionDefaults.requiredCeHours,
    );
    const renewalPeriodMonths = Number(
      rules.renewalPeriodMonths ?? professionDefaults.renewalPeriodMonths,
    );
    const period = await this.ensureActiveRenewalPeriod(
      userId,
      requiredHours,
      profile,
      tenantProvider.nacProviderReference,
      renewalPeriodMonths,
    );
    return {
      id: period.id,
      label: period.label ?? 'Current Renewal Period',
    };
  }

  async listRenewalPeriods(user: AuthUser) {
    const periods = await this.prisma.renewalPeriod.findMany({
      where: { userId: user.userId },
      orderBy: { periodStart: 'desc' },
    });
    return periods.map((p) => ({
      id: p.id,
      label: p.label,
      status: p.status,
      periodStart: p.periodStart.toISOString().slice(0, 10),
      periodEnd: p.periodEnd.toISOString().slice(0, 10),
      requiredHours: Number(p.requiredHours),
      earnedHours: Number(p.earnedHours),
      remainingHours: Math.max(0, Number(p.requiredHours) - Number(p.earnedHours)),
    }));
  }

  private async ensureActiveRenewalPeriod(
    userId: string,
    requiredHours: number,
    profile: LearnerProfileContext,
    providerReference: string,
    renewalPeriodMonths: number,
  ) {
    const existing = await this.prisma.renewalPeriod.findFirst({
      where: { userId, status: RenewalPeriodStatus.ACTIVE },
      orderBy: { periodEnd: 'desc' },
    });
    if (existing) {
      return existing;
    }

    const now = new Date();
    const usedLicenseExpiresOn = Boolean(profile?.licenseExpiresOn);
    const periodEnd =
      profile?.licenseExpiresOn ?? this.addMonths(now, renewalPeriodMonths);

    let periodStart: Date;
    let birthdayBoundarySource: 'licenseExpiresOn' | 'birthdate_derived' | 'fallback';

    if (profile?.licenseEffectiveOn) {
      periodStart = profile.licenseEffectiveOn;
      birthdayBoundarySource = usedLicenseExpiresOn ? 'licenseExpiresOn' : 'fallback';
    } else if (profile?.birthMonth != null && profile?.birthDay != null) {
      const twoYearsBeforeEnd = this.subtractOneYear(this.subtractOneYear(periodEnd));
      periodStart = this.birthdayOnOrAfter(
        twoYearsBeforeEnd,
        profile.birthMonth,
        profile.birthDay,
      );
      birthdayBoundarySource = 'birthdate_derived';
    } else {
      periodStart = this.addMonths(periodEnd, -renewalPeriodMonths);
      birthdayBoundarySource = usedLicenseExpiresOn ? 'licenseExpiresOn' : 'fallback';
    }

    const year1End = this.subtractOneYear(periodEnd);
    const year2Start = new Date(year1End);
    year2Start.setDate(year2Start.getDate() + 1);

    const professionLabel =
      profile?.profession?.code === 'HHA'
        ? 'California HHA renewal'
        : 'California CNA renewal';

    const created = await this.prisma.renewalPeriod.create({
      data: {
        userId,
        label: `${professionLabel} ${periodStart.getFullYear()}–${periodEnd.getFullYear()}`,
        status: RenewalPeriodStatus.ACTIVE,
        periodStart,
        periodEnd,
        requiredHours,
        earnedHours: 0,
        metadata: {
          cycle: '24-month',
          jurisdictionCode: CA_CNA_COMPLIANCE.jurisdictionCode,
          providerReference,
          year1End: year1End.toISOString().slice(0, 10),
          year2Start: year2Start.toISOString().slice(0, 10),
          birthdayBoundarySource,
        },
      },
    });

    return created;
  }

  /** First birthday on or after `anchor`. */
  private birthdayOnOrAfter(anchor: Date, birthMonth: number, birthDay: number): Date {
    const year = anchor.getUTCFullYear();
    let candidate = new Date(Date.UTC(year, birthMonth - 1, birthDay));
    if (candidate.getTime() < anchor.getTime()) {
      candidate = new Date(Date.UTC(year + 1, birthMonth - 1, birthDay));
    }
    return candidate;
  }

  private resolveEntryHours(entry: TranscriptEntryWithCompletion): number {
    return this.ceuSync.resolveAuthoritativeCeuHours(
      entry.completion?.courseVersion?.ceHours,
      entry.ceHours,
    );
  }

  private sumEntryHours(entries: TranscriptEntryWithCompletion[]): number {
    return entries.reduce((s, e) => s + this.resolveEntryHours(e), 0);
  }

  private resolveDeliveryMode(entry: {
    deliveryMode?: string | null;
    completion?: {
      courseVersion?: { deliveryMode?: string | null } | null;
    } | null;
  }): 'ONLINE' | 'IN_PERSON' | 'BLENDED' | 'OTHER' {
    const mode =
      entry.deliveryMode ??
      entry.completion?.courseVersion?.deliveryMode ??
      'ONLINE';
    return mode as 'ONLINE' | 'IN_PERSON' | 'BLENDED' | 'OTHER';
  }

  private buildCategoryBreakdown(entries: TranscriptEntryWithCompletion[]) {
    const map = new Map<string, number>();
    for (const e of entries) {
      const slug =
        (e.metadata as { categorySlug?: string })?.categorySlug ?? 'uncategorized';
      const hours = this.resolveEntryHours(e);
      map.set(slug, (map.get(slug) ?? 0) + hours);
    }
    return [...map.entries()].map(([slug, hours]) => ({
      slug,
      label:
        CA_CNA_COMPLIANCE.inServiceCategories.find((c) => c.slug === slug)?.label ?? slug,
      hours,
    }));
  }

  private mandatoryTopicWarnings(
    mandatoryTopics: string[],
    breakdown: Array<{ slug: string; hours: number }>,
  ) {
    const warnings: Array<{ topic: string; message: string; severity: 'warning' | 'info' }> = [];
    for (const topic of mandatoryTopics) {
      const hours = breakdown.find((b) => b.slug === topic)?.hours ?? 0;
      if (hours <= 0) {
        warnings.push({
          topic,
          severity: 'warning',
          message: `Required in-service topic "${topic}" has no completed CEUs in this renewal period.`,
        });
      }
    }
    return warnings;
  }

  private resolveStatus(
    creditedHours: number,
    requiredHours: number,
    year1Hours: number,
    year2Hours: number,
    minHoursPerYear: number,
    onlineCapExceeded: boolean,
    daysUntilExpiration: number,
    warnings: unknown[],
  ): ComplianceSnapshotStatus {
    const totalMet = creditedHours >= requiredHours;
    const year1Met = year1Hours >= minHoursPerYear;
    const year2Met = year2Hours >= minHoursPerYear;
    const allMet =
      totalMet &&
      year1Met &&
      year2Met &&
      !onlineCapExceeded &&
      (warnings as []).length === 0;

    if (allMet) return ComplianceSnapshotStatus.COMPLIANT;

    if (
      daysUntilExpiration <= 90 ||
      creditedHours < requiredHours * 0.5 ||
      !year1Met ||
      !year2Met ||
      onlineCapExceeded
    ) {
      return ComplianceSnapshotStatus.AT_RISK;
    }

    return ComplianceSnapshotStatus.NON_COMPLIANT;
  }

  private statusLabel(status: ComplianceSnapshotStatus): string {
    const labels: Record<ComplianceSnapshotStatus, string> = {
      COMPLIANT: 'CE hours on track',
      AT_RISK: 'Action needed',
      NON_COMPLIANT: 'Behind schedule',
      UNKNOWN: 'Unknown',
    };
    return labels[status] ?? 'Unknown';
  }

  private daysUntil(end: Date): number {
    const ms = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }

  private subtractOneYear(date: Date): Date {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }
}
