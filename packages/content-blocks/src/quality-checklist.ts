import type { QualityChecklistItem, QualityFrameworkPlaceholders } from './course-blueprint.types';
import { DEFAULT_QUALITY_FRAMEWORK } from './standard-one-hour-blueprint';

/** CMS-facing production quality checklist derived from quality framework placeholders. */
export function buildQualityChecklist(
  framework: QualityFrameworkPlaceholders = DEFAULT_QUALITY_FRAMEWORK,
): QualityChecklistItem[] {
  return [
    {
      id: 'cnaScopeAlignment',
      label: 'CNA scope alignment',
      status: framework.cnaScopeAlignment.status,
      note: framework.cnaScopeAlignment.note,
    },
    {
      id: 'californiaSpecificNotes',
      label: 'California-specific regulatory notes',
      status: framework.californiaSpecificNotes.status,
      note: framework.californiaSpecificNotes.note,
    },
    {
      id: 'healthcareVisuals',
      label: 'Healthcare-appropriate visuals',
      status: framework.healthcareVisuals.status,
      note: framework.healthcareVisuals.note,
    },
    {
      id: 'infographics',
      label: 'Infographic / visual summary',
      status: framework.infographics.status,
      note: framework.infographics.note,
    },
    {
      id: 'downloadableResources',
      label: 'Downloadable resource (optional)',
      status: framework.downloadableResources.status,
      note: framework.downloadableResources.note,
    },
    {
      id: 'accessibilityCaptions',
      label: 'Accessibility (alt text, captions, transcripts)',
      status: framework.accessibilityCaptions.status,
      note: framework.accessibilityCaptions.note,
    },
    {
      id: 'multilingual',
      label: 'Multilingual support placeholder',
      status: framework.multilingual.status,
      note: framework.multilingual.note,
    },
    {
      id: 'referencesBibliography',
      label: 'References / bibliography',
      status: framework.referencesBibliography.status,
      note: framework.referencesBibliography.note,
    },
    {
      id: 'instructorAuthorMetadata',
      label: 'Instructor / author metadata',
      status: framework.instructorAuthorMetadata.status,
      note: framework.instructorAuthorMetadata.note,
    },
    {
      id: 'cnaScenarios',
      label: 'CNA scenario realism (California SNF/RCFE)',
      status: framework.cnaScenarios.status,
      note: framework.cnaScenarios.note,
    },
  ];
}
