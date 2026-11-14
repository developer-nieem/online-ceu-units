/** Primary support contact for identity-related update requests. */
export const IDENTITY_SUPPORT_EMAIL = 'support@onlineceunits.com';

/**
 * Fields locked on learner self-service profile.
 * Admins may update these through administrative workflows/tools.
 */
export const LOCKED_LEARNER_IDENTITY_FIELDS = ['fullLegalName', 'primaryEmail'] as const;

export const IDENTITY_LOCK_NOTICE =
  'Your full legal name and primary email are used for certificates, transcripts, and compliance records and cannot be changed directly online. Please contact support for identity-related updates.';

export const IDENTITY_SECTION_DESCRIPTION =
  'Your official certificate and transcript identity. These records are maintained for compliance and audit purposes.';

export const US_STATES = [
  { value: 'CA', label: 'California' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'NV', label: 'Nevada' },
  { value: 'OR', label: 'Oregon' },
  { value: 'WA', label: 'Washington' },
] as const;

export const BIRTH_DAYS = Array.from({ length: 31 }, (_, index) => {
  const day = String(index + 1).padStart(2, '0');
  return { value: day, label: String(index + 1) };
}) as ReadonlyArray<{ value: string; label: string }>;

export const BIRTH_MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const;

/** California CNA renewal — total CE/In-Service hours required over a 2-year certification period. */
export const CALIFORNIA_CNA_TOTAL_CE_REQUIRED = 48;

/** Minimum CE/In-Service hours generally required during each year of the certification period. */
export const CALIFORNIA_CNA_MIN_CE_PER_YEAR = 12;

/** Maximum CE Units that may generally be completed online during the 2-year certification period. */
export const CALIFORNIA_CNA_MAX_ONLINE_CE_UNITS = 24;

/** Each CAL ACE online course awards this many CE Units. */
export const CAL_ACE_ONLINE_COURSE_CE_UNITS = 1;

export const CALIFORNIA_RENEWAL_GUIDANCE = [
  'California CNA renewal generally follows a 2-year certification cycle.',
  'California CNA renewal requires 48 total CE/In-Service hours.',
  'At least 12 hours must generally be completed during each year of the certification period.',
  'A maximum of 24 CE Units may generally be completed online during the 2-year certification period.',
  'Remaining CE requirements may need employer/in-person/in-service training depending on CDPH requirements.',
  'CDPH allows you to submit your renewal application up to six months before your certificate expires.',
] as const;

export const CALIFORNIA_RENEWAL_PROGRESS_DESCRIPTION =
  'Online CE Units completed through CAL ACE Nursing Academy during your current CNA certification period. Each online course counts as 1 CE Unit.';

export const CALIFORNIA_RENEWAL_ADDITIONAL_HOURS_NOTE =
  'You may still need additional employer/in-person/in-service hours depending on your renewal status and CDPH requirements.';

/** CDPH reactivation option when renewal CE requirements are not met (expired < 2 years). */
export const CALIFORNIA_REACTIVATION_NOTE =
  'If you cannot meet the renewal requirements and your certificate has been expired for less than two years, you may be able to reactivate it by taking the Competency Evaluation Examination. Submit the CDPH 283C Renewal Application with "Yes" checked on Question 6. CDPH will respond with approval and exam scheduling instructions. CDPH decides eligibility — this is guidance only.';

export const CALIFORNIA_EARLY_RENEWAL_NOTE =
  'CDPH allows you to submit your renewal application up to six months before your certificate expires.';

export const CDPH_RESOURCES = [
  {
    label: 'CDPH 283A CE/In-Service Tracking Form',
    href: 'https://www.cdph.ca.gov/cdph%20document%20library/controlledforms/cdph283a.pdf',
  },
  {
    label: 'CDPH 283C CNA/HHA Renewal Application',
    href: 'https://www.cdph.ca.gov/cdph%20document%20library/controlledforms/cdph283c.pdf',
  },
  {
    label: 'CDPH Online Submission Portal',
    href: 'https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/Online-Submission-Page.aspx',
  },
  {
    label: 'CAL ACE Continuing Education (CEU)',
    href: 'https://cna.school/ceu',
  },
] as const;

export const PROFILE_COMPLIANCE_DISCLAIMER = [
  'CAL ACE Nursing Academy provides renewal progress summaries and CE tracking tools as an educational convenience only.',
  'Final renewal eligibility, certification periods, online CE acceptance, delinquency determinations, employment requirements, and renewal approvals are determined solely by the California Department of Public Health (CDPH).',
  'CDPH requirements and policies may change over time. Learners are responsible for independently reviewing current CDPH requirements, maintaining their own records, and submitting required forms directly to CDPH.',
  'CAL ACE Nursing Academy does not guarantee renewal approval or accuracy of renewal calculations.',
  'Renewal calculations shown in this profile may not perfectly reflect CDPH determinations.',
] as const;
