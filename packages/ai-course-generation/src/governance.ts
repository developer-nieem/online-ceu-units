import type { GenerateCourseInput } from './types';

/** Shown in CMS — instructors must not include PHI in generation prompts. */
export const AI_GOVERNANCE_NOTICE =
  'Do not enter resident names, MRNs, dates of birth, addresses, or other protected health information (PHI) in course generation fields. Use generic clinical scenarios only.';

const PHI_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
  /\bMRN[:\s#]*\d+/i,
  /\bresident\s+name\s*:/i,
  /\bpatient\s+name\s*:/i,
];

export function assertNoPhiInGenerationInput(input: GenerateCourseInput): void {
  const blob = [
    input.title,
    input.shortDescription,
    input.californiaRelevance,
    input.stateJurisdiction,
    input.toneFocus,
    input.targetAudience,
  ]
    .filter(Boolean)
    .join(' ');

  for (const pattern of PHI_PATTERNS) {
    if (pattern.test(blob)) {
      throw new Error(
        'Generation input may contain PHI or identifiable resident data. Remove identifiers and use generic scenarios.',
      );
    }
  }
}
