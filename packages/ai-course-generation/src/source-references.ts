import type { GenerateCourseInput, SourceReferencePlaceholder } from './types';

export function buildSourceReferencePlaceholders(
  input: GenerateCourseInput,
): SourceReferencePlaceholder[] {
  const jurisdiction = input.stateJurisdiction ?? 'California';
  return [
    {
      id: 'cdph-nac',
      label: 'CDPH / NAC provider references',
      status: 'placeholder',
      note: 'Add official provider and approval citations before publish.',
    },
    {
      id: 'title-22',
      label: `${jurisdiction} skilled nursing regulations`,
      status: 'placeholder',
      note: 'Cite Title 22 or applicable state rules referenced in the course.',
    },
    {
      id: 'clinical-guidelines',
      label: 'Clinical practice guidelines',
      status: 'placeholder',
      note: 'Link evidence-based sources used for medical accuracy review.',
    },
    {
      id: 'facility-policy',
      label: 'Facility policy crosswalk (optional)',
      status: 'placeholder',
      note: 'Optional employer-specific policy references — not required for catalog.',
    },
  ];
}
