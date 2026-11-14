import { apiFetch } from './api';

export type GenerateCourseFactoryBody = {
  courseTitle: string;
  topicDescription: string;
  targetAudience?: string;
  ceHours?: number;
  regulatoryContext?: string;
  providerId?: 'mock' | 'anthropic' | 'openai';
};

export type GenerateCourseFactoryResponse = {
  courseSlug: string;
  courseId: string;
  courseVersionId: string;
  moduleCount: number;
  lessonCount: number;
};

export async function generateCourseViaFactory(body: GenerateCourseFactoryBody) {
  return apiFetch<GenerateCourseFactoryResponse>('/cms/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
