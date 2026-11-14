import type { AiSafetyReviewItem } from './types';
import type { GenerateCourseInput } from './types';

/** Post-generation review — instructor must complete before publish. */
export function buildAiSafetyReviewChecklist(
  topicLabel: string,
  input?: GenerateCourseInput,
): AiSafetyReviewItem[] {
  const jurisdiction = input?.stateJurisdiction ?? 'California';
  return [
    {
      id: 'hallucination',
      label: 'Hallucination / unsupported claims review',
      status: 'pending',
      note: `Verify clinical statements in "${topicLabel}" against approved sources; remove unsupported claims.`,
    },
    {
      id: 'medical-accuracy',
      label: 'Medical accuracy review',
      status: 'pending',
      note: 'Licensed reviewer confirms content reflects current evidence-based practice.',
    },
    {
      id: 'cna-scope',
      label: 'CNA scope of practice review',
      status: 'pending',
      note: 'Confirm CNAs are not directed to perform nursing acts; nurse delegation is clear.',
    },
    {
      id: 'jurisdiction-compliance',
      label: `${jurisdiction} jurisdiction / state compliance review`,
      status: 'pending',
      note: `Confirm ${jurisdiction} rules, reporting, and Online CE delivery language is accurate.`,
    },
    {
      id: 'cdph-alignment',
      label: 'CDPH / regulatory alignment (California)',
      status: 'pending',
      note: 'When applicable: CDPH Online CE, NAC provider obligations, and certificate/transcript accuracy.',
    },
    {
      id: 'citations',
      label: 'References / bibliography review',
      status: 'pending',
      note: 'Add bibliography and inline citations where clinical claims require attribution.',
    },
    {
      id: 'bias-accessibility',
      label: 'Bias, inclusion, and accessibility review',
      status: 'pending',
      note: 'Check inclusive language, alt text, captions/transcripts placeholders, and WCAG-conscious interactions.',
    },
  ];
}
