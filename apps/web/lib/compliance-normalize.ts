import type { CourseComplianceInfo } from './course-detail';
import type { ComplianceSummary } from './credentials-types';

const DEFAULT_COMPLETION_REQUIREMENTS = [
  'Sign in with your learner account',
  'Complete interactive lesson content (50 minutes active participation per 1 Online CE hour)',
  'Pass the final course exam',
  'Submit the learner attestation before your certificate is issued',
];

/** Backward-safe provider block after API shape changes. */
export function normalizeComplianceProvider(
  provider: ComplianceSummary['provider'] | Record<string, unknown> | null | undefined,
): ComplianceSummary['provider'] {
  const p = (provider ?? {}) as Record<string, unknown>;
  return {
    name: String(p.name ?? 'CAL ACE Nursing Academy'),
    nacProviderReference:
      typeof p.nacProviderReference === 'string' && p.nacProviderReference.trim()
        ? p.nacProviderReference.trim()
        : null,
    contactSummary:
      typeof p.contactSummary === 'string'
        ? p.contactSummary
        : ([p.approvalNumber, p.licenseInfo].filter(Boolean).join(' · ') || null),
    supportContact: typeof p.supportContact === 'string' ? p.supportContact : null,
    approvalStatusLabel:
      typeof p.approvalStatusLabel === 'string' ? p.approvalStatusLabel : null,
  };
}

/** Display-layer expiry check — compares date-only periodEnd (YYYY-MM-DD) to today. */
export function isRenewalPeriodExpired(periodEnd: string | null | undefined): boolean {
  if (!periodEnd) return false;
  const today = new Date().toISOString().slice(0, 10);
  return periodEnd < today;
}

export function normalizeComplianceSummary(
  raw: ComplianceSummary | null | undefined,
): ComplianceSummary | null {
  if (!raw) return null;

  const period = raw.renewalPeriod ?? {
    id: '',
    label: 'California CNA renewal',
    status: 'ACTIVE',
    periodStart: '',
    periodEnd: '',
    requiredHours: 48,
    earnedHours: 0,
    remainingHours: 48,
    pctComplete: 0,
    daysUntilExpiration: 0,
  };

  return {
    ...raw,
    renewalPeriod: period,
    provider: normalizeComplianceProvider(raw.provider),
    inServiceCategories: raw.inServiceCategories ?? [],
    categoryBreakdown: raw.categoryBreakdown ?? [],
    topicWarnings: raw.topicWarnings ?? [],
    mandatoryTopics: raw.mandatoryTopics ?? [],
    yearSplit: raw.yearSplit,
    onlineCap: raw.onlineCap,
  };
}

/** Ensures course detail compliance always has completionRequirements[]. */
export function normalizeCourseCompliance(
  compliance: Partial<CourseComplianceInfo> & {
    approvalNote?: string;
    licenseInfo?: string;
  } | null | undefined,
): CourseComplianceInfo {
  if (!compliance) {
    return {
      providerName: 'CAL ACE Nursing Academy',
      providerContact: null,
      supportContact: null,
      approvalStatusLabel: null,
      completionRequirements: DEFAULT_COMPLETION_REQUIREMENTS,
    };
  }

  if (Array.isArray(compliance.completionRequirements) && compliance.completionRequirements.length > 0) {
    return {
      providerName: compliance.providerName ?? 'CAL ACE Nursing Academy',
      providerContact: compliance.providerContact ?? null,
      supportContact: compliance.supportContact ?? null,
      approvalStatusLabel: compliance.approvalStatusLabel ?? null,
      completionRequirements: compliance.completionRequirements,
    };
  }

  const legacyContact = [compliance.approvalNote, compliance.licenseInfo].filter(Boolean).join(' · ');

  return {
    providerName: compliance.providerName ?? 'CAL ACE Nursing Academy',
    providerContact: compliance.providerContact ?? (legacyContact || null),
    supportContact: compliance.supportContact ?? null,
    approvalStatusLabel: compliance.approvalStatusLabel ?? null,
    completionRequirements: DEFAULT_COMPLETION_REQUIREMENTS,
  };
}
