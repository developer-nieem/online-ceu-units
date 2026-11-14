export * from './types';
export * from './constants';
export {
  CNA_CEU_GENERATION_TEMPLATE,
  buildBehavioralObjectives,
  buildCourseThumbnailPrompt,
  buildLlmGenerationPrompt,
} from './course-generation-template';
export { buildAiSafetyReviewChecklist } from './safety-checklist';
export { buildMediaGenerationPrompts } from './media-prompts';
export { buildSourceReferencePlaceholders } from './source-references';
export { AI_GOVERNANCE_NOTICE, assertNoPhiInGenerationInput } from './governance';
export { buildCourseGenerationPreview } from './generation-preview';
export type { CourseGenerationPreview } from './generation-preview';
export { buildAiLessonDocument } from './lesson-content-builder';
export { assertAiCoursePublishAllowed, courseRequiresAiApproval } from './publish-guard';
export type { AiCourseGenerationProvider } from './providers/ai-course-provider.interface';
export { MockAiCourseProvider } from './providers/mock-ai-provider';
export { AnthropicAiCourseProvider } from './providers/anthropic-ai-provider';

import { AnthropicAiCourseProvider } from './providers/anthropic-ai-provider';
import { MockAiCourseProvider } from './providers/mock-ai-provider';
import type { AiCourseGenerationProvider } from './providers/ai-course-provider.interface';

const providers: Record<string, AiCourseGenerationProvider> = {
  mock: new MockAiCourseProvider(),
  anthropic: new AnthropicAiCourseProvider(),
};

/** Resolve provider — defaults to anthropic when ANTHROPIC_API_KEY is set, otherwise mock. */
export function getAiCourseProvider(
  providerId = process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock',
): AiCourseGenerationProvider {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`AI course provider "${providerId}" is not registered`);
  }
  return provider;
}

export function listAiCourseProviders(): { id: string; label: string; available: boolean }[] {
  return [
    { id: 'mock', label: 'CAL ACE Mock Generator (development)', available: true },
    { id: 'openai', label: 'OpenAI (not configured)', available: false },
    {
      id: 'anthropic',
      label: 'Anthropic Claude (claude-sonnet-4-20250514)',
      available: true,
    },
  ];
}
