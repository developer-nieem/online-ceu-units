import { ContentPublishStatus, type Lesson } from '@calace/db';

import type { CmsLesson, CmsLessonBlock, CmsLessonCompletionRule, CmsPublishStatus } from '../types';

export const DEFAULT_MODULE_SLUG = 'main';

export interface LessonContentPayload {
  body?: string;
  videoUrl?: string;
  requiredForCompletion?: boolean;
  completionRule?: CmsLessonCompletionRule;
  readingBlocks?: CmsLessonBlock[];
  interactionBlocks?: CmsLessonBlock[];
  quizBlocks?: CmsLessonBlock[];
  legacySeedId?: string;
}

export function toContentPublishStatus(status: CmsPublishStatus): ContentPublishStatus {
  switch (status) {
    case 'published':
      return ContentPublishStatus.PUBLISHED;
    case 'archived':
      return ContentPublishStatus.ARCHIVED;
    default:
      return ContentPublishStatus.DRAFT;
  }
}

export function fromContentPublishStatus(status: ContentPublishStatus): CmsPublishStatus {
  switch (status) {
    case ContentPublishStatus.PUBLISHED:
      return 'published';
    case ContentPublishStatus.ARCHIVED:
      return 'archived';
    default:
      return 'draft';
  }
}

export function parseLessonContent(raw: unknown): LessonContentPayload {
  const data = raw as LessonContentPayload;
  return {
    body: data?.body ?? '',
    videoUrl: data?.videoUrl,
    requiredForCompletion: data?.requiredForCompletion ?? true,
    completionRule: data?.completionRule ?? 'view_all',
    readingBlocks: data?.readingBlocks ?? [],
    interactionBlocks: data?.interactionBlocks ?? [],
    quizBlocks: data?.quizBlocks ?? [],
    legacySeedId: data?.legacySeedId,
  };
}

export function buildLessonContent(input: Partial<CmsLesson>): LessonContentPayload {
  return {
    body: input.body ?? extractBodyFromBlocks(input),
    videoUrl: input.videoUrl,
    requiredForCompletion: input.requiredForCompletion ?? true,
    completionRule: input.completionRule ?? 'view_all',
    readingBlocks: input.readingBlocks ?? [],
    interactionBlocks: input.interactionBlocks ?? [],
    quizBlocks: input.quizBlocks ?? [],
    legacySeedId: input.id,
  };
}

export function extractBodyFromBlocks(lesson: Partial<CmsLesson>): string {
  const fromBlocks = (lesson.readingBlocks ?? [])
    .map((block) => block.content?.trim())
    .filter(Boolean)
    .join('\n\n');

  return fromBlocks || lesson.contentSummary || lesson.body || '';
}

export function mapDbLessonToCms(lesson: Lesson, courseId?: string): CmsLesson {
  const content = parseLessonContent(lesson.content);

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    sortOrder: lesson.sortOrder,
    body: content.body,
    contentSummary: lesson.description ?? undefined,
    videoUrl: content.videoUrl,
    readingBlocks: content.readingBlocks ?? [],
    interactionBlocks: content.interactionBlocks ?? [],
    quizBlocks: content.quizBlocks ?? [],
    completionRule: content.completionRule ?? 'view_all',
    estimatedMinutes: lesson.durationMinutes ?? undefined,
    requiredForCompletion: content.requiredForCompletion ?? true,
    status: fromContentPublishStatus(lesson.status),
    courseId,
  };
}

export type CmsLessonInput = Omit<CmsLesson, 'id'> & { id?: string };

export function cmsLessonFromSeed(
  seed: Record<string, unknown>,
  courseId?: string,
): CmsLessonInput {
  const readingBlocks = (seed.readingBlocks as CmsLessonBlock[]) ?? [];
  const lesson: CmsLessonInput = {
    id: seed.id as string | undefined,
    slug: seed.slug as string,
    title: seed.title as string,
    sortOrder: seed.sortOrder as number,
    contentSummary: (seed.contentSummary as string) ?? '',
    videoUrl: seed.videoUrl as string | undefined,
    readingBlocks,
    interactionBlocks: (seed.interactionBlocks as CmsLessonBlock[]) ?? [],
    quizBlocks: (seed.quizBlocks as CmsLessonBlock[]) ?? [],
    completionRule: (seed.completionRule as CmsLessonCompletionRule) ?? 'view_all',
    estimatedMinutes: seed.estimatedMinutes as number | undefined,
    requiredForCompletion: (seed.requiredForCompletion as boolean | undefined) ?? true,
    status: (seed.status as CmsPublishStatus) ?? 'published',
    courseId,
  };
  lesson.body = extractBodyFromBlocks(lesson);
  return lesson;
}
