import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ComplianceSnapshotStatus,
  RenewalPeriodStatus,
} from '@calace/db';
import type { Prisma } from '@calace/db';

import { DEFAULT_PROVIDER_COMPLIANCE_SETTINGS } from '../provider-compliance/provider-compliance.settings';
import type { ProviderComplianceSettingsService } from '../provider-compliance/provider-compliance-settings.service';
import type { CertificateCeuSyncService } from './certificate-ceu-sync.service';
import type { CredentialsOrchestratorService } from './credentials-orchestrator.service';
import { ComplianceService } from './compliance.service';
import type { PrismaService } from '../prisma/prisma.service';

type TranscriptEntryWithCourseVersion = Prisma.TranscriptEntryGetPayload<{
  include: { completion: { include: { courseVersion: true } } };
}>;

// ── TRAP #2 oracle entries (evaluate.spec.ts) ──────────────────────────────
// 30 online + 18 in-person raw => 42 credited (24 online applied + 18 in-person)

function makeEntry(
  completedOn: string,
  hours: number,
  deliveryMode: 'ONLINE' | 'IN_PERSON',
) {
  return {
    ceHours: hours,
    deliveryMode,
    completedOn: new Date(completedOn),
    metadata: {},
    completion: {
      courseVersion: { ceHours: hours, deliveryMode },
    },
  };
}

const TRAP2_ALL = [
  makeEntry('2024-06-01', 15, 'ONLINE'),
  makeEntry('2024-09-01', 9, 'IN_PERSON'),
  makeEntry('2025-08-01', 15, 'ONLINE'),
  makeEntry('2025-10-01', 9, 'IN_PERSON'),
];

const TRAP2_YEAR1 = [TRAP2_ALL[0], TRAP2_ALL[1]];
const TRAP2_YEAR2 = [TRAP2_ALL[2], TRAP2_ALL[3]];

const PERIOD_START = new Date('2024-03-20');
const PERIOD_END = new Date('2026-05-15');

function resolveAuthoritativeCeuHours(
  courseVersionCeHours: unknown,
  fallback?: unknown,
): number {
  const fromVersion = Number(courseVersionCeHours);
  if (Number.isFinite(fromVersion) && fromVersion > 0) return fromVersion;
  const fb = Number(fallback ?? 0);
  return Number.isFinite(fb) ? fb : 0;
}

describe('ComplianceService.getSummaryForUser', () => {
  let service: ComplianceService;
  let mockPrisma: PrismaService;
  let mockOrchestrator: CredentialsOrchestratorService;
  let mockCeuSync: CertificateCeuSyncService;
  let mockProviderSettings: ProviderComplianceSettingsService;

  function armTranscriptFindManyQueue() {
    vi.mocked(mockPrisma.transcriptEntry.findMany)
      .mockResolvedValueOnce(TRAP2_ALL as unknown as TranscriptEntryWithCourseVersion[])
      .mockResolvedValueOnce(TRAP2_YEAR1 as unknown as TranscriptEntryWithCourseVersion[])
      .mockResolvedValueOnce(TRAP2_YEAR2 as unknown as TranscriptEntryWithCourseVersion[]);
  }

  beforeEach(() => {
    const tenantProvider = {
      ...DEFAULT_PROVIDER_COMPLIANCE_SETTINGS,
      nacProviderReference: 'TEST-NAC-REF',
    };

    mockOrchestrator = {
      syncPendingCompletions: vi.fn().mockResolvedValue(undefined),
    } as unknown as CredentialsOrchestratorService;

    mockCeuSync = {
      syncStaleCertificatesForUser: vi.fn().mockResolvedValue(0),
      resolveAuthoritativeCeuHours: vi.fn(resolveAuthoritativeCeuHours),
    } as unknown as CertificateCeuSyncService;

    mockProviderSettings = {
      getForTenant: vi.fn().mockResolvedValue(tenantProvider),
        learnerProviderDisplay: vi.fn().mockReturnValue({
        name: tenantProvider.providerName,
        nacProviderReference: tenantProvider.nacProviderReference,
        contactSummary: null,
        supportContact: tenantProvider.supportContactEmail,
        approvalStatusLabel: null,
      }),
    } as unknown as ProviderComplianceSettingsService;

    mockPrisma = {
      learnerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          licenseEffectiveOn: PERIOD_START,
          licenseExpiresOn: PERIOD_END,
          birthMonth: null,
          birthDay: null,
          jurisdictionId: 'jurisdiction_test',
          professionId: 'profession_test',
          jurisdiction: { code: 'US-CA', name: 'California' },
          profession: { code: 'CNA', name: 'Certified Nursing Assistant' },
        }),
      },
      complianceRuleSet: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'ruleset_test',
          rules: {
            requiredCeHours: 48,
            minHoursPerYear: 12,
            maxOnlineHours: 24,
            renewalPeriodMonths: 24,
            mandatoryTopics: ['infection-control', 'elder-abuse'],
          },
        }),
      },
      renewalPeriod: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'period_test',
          label: 'California CNA renewal 2024–2026',
          status: RenewalPeriodStatus.ACTIVE,
          periodStart: PERIOD_START,
          periodEnd: PERIOD_END,
          requiredHours: 48,
          earnedHours: 0,
          metadata: {
            year1End: '2025-05-15',
            year2Start: '2025-05-16',
          },
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      transcriptEntry: {
        findMany: vi.fn(),
      },
      complianceSnapshot: {
        create: vi.fn().mockResolvedValue({
          id: 'snap_test',
          asOfDate: new Date('2026-06-30'),
        }),
      },
    } as unknown as PrismaService;

    armTranscriptFindManyQueue();

    service = new ComplianceService(
      mockPrisma,
      mockOrchestrator,
      mockCeuSync,
      mockProviderSettings,
    );
  });

  /**
   * PROVE-THE-GUARD — cap fix regression (TRAP #2)
   *
   * Raw period total = 48h (30 online + 18 in-person). With maxOnlineHours=24,
   * credited total must be 42 (24 online applied + 18 in-person).
   *
   * This test goes RED if the fix is reverted on any of these lines in
   * compliance.service.ts:
   *   L209  complianceSnapshot.create data.earnedHours: effectiveHours
   *   L239  renewalPeriod.update data.earnedHours: effectiveHours
   *   L260  return renewalPeriod.earnedHours: effectiveHours
   * (Changing L190 resolveStatus's first arg to raw `earnedHours` does NOT flip
   * status here — onlineCapExceeded keeps AT_RISK — but L260 makes
   * renewalPeriod.earnedHours 48, remainingHours 0, pctComplete 100.)
   */
  it('TRAP #2: credits capped effectiveHours (42), not raw earned (48)', async () => {
    const summary = await service.getSummaryForUser('user_test', 'tenant_test');

    expect(summary.renewalPeriod.earnedHours).toBe(42);
    expect(summary.renewalPeriod.remainingHours).toBe(6);
    expect(summary.renewalPeriod.pctComplete).toBe(88);
    expect(summary.status).toBe(ComplianceSnapshotStatus.AT_RISK);
    expect(summary.onlineCap.onlineHours).toBe(30);
    expect(summary.onlineCap.onlineHoursApplied).toBe(24);
    expect(summary.onlineCap.capExceeded).toBe(true);
    expect(summary.onlineCap.effectiveHours).toBe(42);
    expect(summary.yearSplit.year1.earnedHours).toBe(24);
    expect(summary.yearSplit.year2.earnedHours).toBe(24);

    expect(mockPrisma.complianceSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ earnedHours: 42 }),
      }),
    );
  });

  it('does not report raw 48h as the credited renewal total', async () => {
    const summary = await service.getSummaryForUser('user_test', 'tenant_test');
    const rawEarned = 48;

    expect(summary.renewalPeriod.earnedHours).not.toBe(rawEarned);
    expect(summary.onlineCap.effectiveHours).not.toBe(rawEarned);
  });

  it('HHA: online hours are capped at 0 per CDPH 283C', async () => {
    vi.mocked(mockPrisma.learnerProfile.findUnique).mockResolvedValue({
      licenseEffectiveOn: PERIOD_START,
      licenseExpiresOn: PERIOD_END,
      birthMonth: null,
      birthDay: null,
      jurisdictionId: 'jurisdiction_test',
      professionId: 'profession_hha',
      jurisdiction: { code: 'US-CA', name: 'California' },
      profession: { code: 'HHA', name: 'Home Health Aide' },
    });

    vi.mocked(mockPrisma.complianceRuleSet.findFirst).mockResolvedValue({
      id: 'ruleset_hha',
      rules: {
        renewalPeriodMonths: 24,
        mandatoryTopics: ['infection-control'],
      },
    });

    const hhaEntries = [
      makeEntry('2024-06-01', 10, 'ONLINE'),
      makeEntry('2024-09-01', 14, 'IN_PERSON'),
    ];
    vi.mocked(mockPrisma.transcriptEntry.findMany).mockReset();
    vi.mocked(mockPrisma.transcriptEntry.findMany)
      .mockResolvedValueOnce(hhaEntries as unknown as TranscriptEntryWithCourseVersion[])
      .mockResolvedValueOnce(hhaEntries as unknown as TranscriptEntryWithCourseVersion[])
      .mockResolvedValueOnce([] as unknown as TranscriptEntryWithCourseVersion[]);

    const summary = await service.getSummaryForUser('user_hha', 'tenant_test');

    expect(summary.onlineCap.maxOnlineHours).toBe(0);
    expect(summary.onlineCap.onlineHoursApplied).toBe(0);
    expect(summary.onlineCap.capExceeded).toBe(true);
  });
});

describe('ComplianceService.ensureActiveRenewalPeriod — birthday year1End', () => {
  let service: ComplianceService;
  let mockPrisma: PrismaService;
  let createSpy: ReturnType<typeof vi.fn>;

  const baseProfile = {
    jurisdictionId: 'jurisdiction_test',
    professionId: 'profession_test',
    jurisdiction: { code: 'US-CA', name: 'California' },
    profession: { code: 'CNA', name: 'Certified Nursing Assistant' },
  };

  const baseRules = {
    id: 'ruleset_test',
    rules: {
      requiredCeHours: 48,
      minHoursPerYear: 12,
      maxOnlineHours: 24,
      renewalPeriodMonths: 24,
      mandatoryTopics: ['infection-control', 'elder-abuse'],
    },
  };

  beforeEach(() => {
    createSpy = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'period_new',
        ...data,
        earnedHours: 0,
      }),
    );

    mockPrisma = {
      learnerProfile: { findUnique: vi.fn() },
      complianceRuleSet: {
        findFirst: vi.fn().mockResolvedValue(baseRules),
      },
      renewalPeriod: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: createSpy,
        update: vi.fn(),
      },
      transcriptEntry: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      complianceSnapshot: {
        create: vi.fn().mockResolvedValue({ id: 'snap_test', asOfDate: new Date() }),
      },
    } as unknown as PrismaService;

    service = new ComplianceService(
      mockPrisma,
      { syncPendingCompletions: vi.fn().mockResolvedValue(undefined) } as unknown as CredentialsOrchestratorService,
      {
        syncStaleCertificatesForUser: vi.fn().mockResolvedValue(0),
        resolveAuthoritativeCeuHours: vi.fn(resolveAuthoritativeCeuHours),
      } as unknown as CertificateCeuSyncService,
      {
        getForTenant: vi.fn().mockResolvedValue({
          ...DEFAULT_PROVIDER_COMPLIANCE_SETTINGS,
          nacProviderReference: 'TEST-NAC-REF',
        }),
        learnerProviderDisplay: vi.fn().mockReturnValue({
          name: 'Test Provider',
          contactSummary: null,
          supportContact: null,
          approvalStatusLabel: null,
        }),
      } as unknown as ProviderComplianceSettingsService,
    );
  });

  function profileWith(overrides: Record<string, unknown>) {
    vi.mocked(mockPrisma.learnerProfile.findUnique).mockResolvedValue({
      ...baseProfile,
      ...overrides,
    } as never);
  }

  it('CDPH 283A: year1End is first expiration birthday (subtractOneYear of periodEnd)', async () => {
    profileWith({
      licenseEffectiveOn: new Date('2024-03-20'),
      licenseExpiresOn: new Date('2026-05-15'),
      birthMonth: 5,
      birthDay: 15,
    });

    await service.getSummaryForUser('user_test', 'tenant_test');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            year1End: '2025-05-15',
            year2Start: '2025-05-16',
            birthdayBoundarySource: 'licenseExpiresOn',
          }),
        }),
      }),
    );
  });

  it('bumps year1End to the next year when periodStart falls on the birthday', async () => {
    profileWith({
      licenseEffectiveOn: new Date('2024-07-01'),
      licenseExpiresOn: new Date('2026-07-01'),
      birthMonth: 7,
      birthDay: 1,
    });

    await service.getSummaryForUser('user_test', 'tenant_test');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            year1End: '2025-07-01',
            year2Start: '2025-07-02',
          }),
        }),
      }),
    );
  });

  it('derives periodStart and year1End from birthdate when license effective is absent', async () => {
    profileWith({
      licenseEffectiveOn: null,
      licenseExpiresOn: new Date('2026-05-15'),
      birthMonth: 5,
      birthDay: 15,
    });

    await service.getSummaryForUser('user_test', 'tenant_test');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          periodStart: new Date('2024-05-15'),
          metadata: expect.objectContaining({
            year1End: '2025-05-15',
            year2Start: '2025-05-16',
            birthdayBoundarySource: 'birthdate_derived',
          }),
        }),
      }),
    );
  });

  it('falls back to expiration minus one year when birthdate is unavailable', async () => {
    profileWith({
      licenseEffectiveOn: new Date('2024-03-20'),
      licenseExpiresOn: new Date('2026-05-15'),
      birthMonth: null,
      birthDay: null,
    });

    await service.getSummaryForUser('user_test', 'tenant_test');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            year1End: '2025-05-15',
            year2Start: '2025-05-16',
          }),
        }),
      }),
    );
  });

  it('HHA: new renewal period label uses California HHA renewal', async () => {
    profileWith({
      licenseEffectiveOn: new Date('2024-03-20'),
      licenseExpiresOn: new Date('2026-05-15'),
      birthMonth: null,
      birthDay: null,
      profession: { code: 'HHA', name: 'Home Health Aide' },
    });

    await service.getSummaryForUser('user_hha', 'tenant_test');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          label: 'California HHA renewal 2024–2026',
        }),
      }),
    );
  });
});
