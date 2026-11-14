import { MINUTES_PER_ONLINE_CEU_HOUR } from '../config/ceu-defaults';

/** Tenant-level provider compliance (admin-configured; internal audit fields never sent to learners). */
export type ProviderComplianceSettings = {
  providerName: string;
  nacProviderReference: string;
  providerContactEmail: string;
  providerContactPhone: string;
  providerContactAddress: string;
  supportContactEmail: string;
  supportContactUrl: string;
  recordRetentionPolicyText: string;
  certificateWordingTemplate: string;
  attestationText: string;
  showApprovalStatusToLearners: boolean;
  cdphOnlineApproved: boolean;
  courseApprovalStatusLabel: string;
  defaultInstructorName: string;
  defaultCeHoursPerCourse: number;
  minutesPerOnlineCeuHour: number;
  /** Admin/ops only — not exposed on learner APIs. */
  internalAuditExportNote: string;
};

export const DEFAULT_PROVIDER_COMPLIANCE_SETTINGS: ProviderComplianceSettings = {
  providerName: 'CAL ACE Nursing Academy',
  nacProviderReference: 'NAC-7384',
  providerContactEmail: 'support@onlineceunits.com',
  providerContactPhone: '(408) 256-0763',
  providerContactAddress: '1535 Landess Ave., Suite 103, Milpitas, CA 95035',
  supportContactEmail: 'support@onlineceunits.com',
  supportContactUrl: '/support',
  recordRetentionPolicyText:
    'Completion records, exam attempts, participation data, and certificates are retained per organizational policy (configure retention period for CDPH 192B audits).',
  certificateWordingTemplate: '{{hours}} Online CE hour(s)',
  attestationText:
    'I attest that I personally completed this online continuing education course, participated actively as required, and that the name on this certificate is correct.',
  showApprovalStatusToLearners: false,
  cdphOnlineApproved: false,
  courseApprovalStatusLabel: 'Pending CDPH online approval',
  defaultInstructorName: 'CAL ACE Instructional Team',
  defaultCeHoursPerCourse: 1,
  minutesPerOnlineCeuHour: MINUTES_PER_ONLINE_CEU_HOUR,
  internalAuditExportNote:
    'State audit exports and CDPH application materials are handled internally — not available in the learner portal.',
};

export const PROVIDER_COMPLIANCE_SETTINGS_KEY = 'providerCompliance';

export function mergeProviderComplianceSettings(
  raw: unknown,
): ProviderComplianceSettings {
  const partial = (raw ?? {}) as Partial<ProviderComplianceSettings>;
  return { ...DEFAULT_PROVIDER_COMPLIANCE_SETTINGS, ...partial };
}
