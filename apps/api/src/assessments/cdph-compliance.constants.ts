import { MINUTES_PER_ONLINE_CEU_HOUR } from '../config/ceu-defaults';

/**
 * California CDPH online CEU placeholders — verify against current CDPH/NAC regulations before production.
 * @see https://www.cdph.ca.gov/Programs/CHCQ/LNC/Certification/Pages/Online-CE-Courses.aspx (reference for ops)
 */
export const CDPH_ONLINE_CEU = {
  /** Minimum active participation minutes per 1.0 CEU hour (CDPH online CE rule). */
  minutesPerCeuHour: MINUTES_PER_ONLINE_CEU_HOUR,
  deliveryMode: 'online' as const,
  identityRequirement:
    'Learner identity verified via unique user ID and password (platform authentication).',
  interactiveRequirement:
    'Course includes interactive knowledge checks, scenarios, and final exam with feedback.',
  certificateFields: [
    'learnerName',
    'courseTitle',
    'onlineCeuHours',
    'completionDate',
    'providerApproval',
    'deliveryMode',
  ],
  retentionNote:
    'Completion, attempts, and audit logs retained for regulatory audit (retention policy TBD).',
  attestationText:
    'I attest that I personally completed this online continuing education course, participated actively as required, and that the name on this certificate is correct.',
} as const;

export const CNA_LICENSE_REQUIRED_FOR_CERTIFICATE =
  'A CNA License Number is required to issue your certificate. Please add it to your profile.';

export function hasUsableCnaLicenseNumber(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function requiredSeatTimeMinutes(ceHours: number): number {
  return Math.ceil(Number(ceHours) * CDPH_ONLINE_CEU.minutesPerCeuHour);
}

