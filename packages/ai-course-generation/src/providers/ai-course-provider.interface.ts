import type { CourseGenerationResult, GenerateCourseInput } from '../types';

/**
 * Pluggable AI course generator — swap mock for OpenAI/Anthropic without changing CMS.
 */
export interface AiCourseGenerationProvider {
  readonly providerId: 'mock' | 'openai' | 'anthropic';
  generateCourse(input: GenerateCourseInput): Promise<CourseGenerationResult>;
}
