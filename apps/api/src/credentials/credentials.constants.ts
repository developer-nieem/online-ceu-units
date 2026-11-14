/** California CNA renewal placeholders — replace with verified CDPH rules in production. */
export const CA_CNA_COMPLIANCE = {
  jurisdictionCode: 'US-CA',
  jurisdictionLabel: 'California',
  professionCode: 'CNA',
  professionLabel: 'Certified Nursing Assistant',
  renewalPeriodMonths: 24,
  requiredCeHours: 48,
  mandatoryTopicSlugs: ['infection-control', 'elder-abuse'] as const,
  inServiceCategories: [
    { slug: 'infection-control', label: 'Infection Control', required: true },
    { slug: 'elder-abuse', label: 'Elder / Dependent Adult Abuse', required: true },
    { slug: 'cna-renewal', label: 'CNA Renewal / Regulatory', required: false },
    { slug: 'professional-development', label: 'Professional Development', required: false },
  ],
  provider: {
    name: 'CAL ACE Nursing Academy',
    approvingBody: 'California Department of Public Health (CDPH)',
    approvalNumber: 'NAC-7384',
    placeholder: false,
  },
  instructorPlaceholder: {
    name: 'CAL ACE Instructional Team',
    placeholder: true,
  },
} as const;

export const CERTIFICATE_EXPORT_PLACEHOLDERS = {
  pdf: {
    status: 'available' as const,
    note: 'Use the Download PDF action to print or save this certificate.',
  },
  qr: {
    status: 'available' as const,
    note: 'QR code encodes the public web verification page at /verify-certificate/token/:token.',
    verifyPathTemplate: '/verify-certificate/token/{token}',
  },
  download: {
    status: 'available' as const,
    note: 'Use Download transcript PDF to print or save your CEU ledger.',
  },
};
