import {
  isBlockDocument,
  type LessonContentDocument,
  type VideoBlock,
} from '@calace/content-blocks';

import type { LessonContentType, PlayerLesson } from '@/lib/player';

import { getCourseById, getLatestCourseVersionSummary } from './db/repository';
import {
  getCoursePreviewStructure,
  type CmsPreviewLesson,
  type CmsPreviewModule,
} from './db/lessons-repository';

type LegacyCatalogLessonContent = {
  type?: LessonContentType;
  title?: string;
  body?: string;
  caption?: string;
  placeholderNote?: string;
  videoUrl?: string;
  readingBlocks?: Array<{ title?: string; content?: string }>;
};

export type CmsCoursePreviewData = {
  course: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
  versionNumber: number;
  versionStatus: string;
  modules: CmsPreviewModule[];
};

function extractVideoUrl(content: LessonContentDocument): string | null {
  const video = content.blocks.find(
    (block): block is VideoBlock => block.type === 'video' && Boolean(block.videoUrl),
  );
  return video?.videoUrl ?? null;
}

function normalizeLegacyContent(raw: unknown, lessonTitle: string): PlayerLesson['content'] {
  const content = (raw ?? {}) as LegacyCatalogLessonContent;

  if (content.type && (content.body?.trim() || content.caption || content.placeholderNote)) {
    return {
      type: content.type,
      title: content.title ?? lessonTitle,
      body: content.body,
      caption: content.caption,
      placeholderNote: content.placeholderNote,
    };
  }

  const bodyFromBlocks = (content.readingBlocks ?? [])
    .map((block) => block.content?.trim())
    .filter(Boolean)
    .join('\n\n');

  const body = (content.body?.trim() || bodyFromBlocks || '').trim();
  const type: LessonContentType = content.videoUrl ? 'video' : (content.type ?? 'text');

  return {
    type,
    title: content.title ?? lessonTitle,
    body: body || undefined,
    caption: content.caption,
    placeholderNote: content.placeholderNote,
  };
}

export function toPreviewPlayerLesson(lesson: CmsPreviewLesson): PlayerLesson {
  const rawContent = lesson.content ?? {};

  if (isBlockDocument(rawContent)) {
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      videoUrl: extractVideoUrl(rawContent),
      content: rawContent,
      contentFormat: 'blocks',
      blockProgress: { blocks: {} },
      status: 'NOT_STARTED',
      progressPct: 0,
      completedAt: null,
    };
  }

  const legacy = normalizeLegacyContent(rawContent, lesson.title);
  const catalog = rawContent as LegacyCatalogLessonContent;

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    durationMinutes: lesson.durationMinutes,
    videoUrl: catalog.videoUrl ?? null,
    content: legacy,
    contentFormat: 'legacy',
    blockProgress: null,
    status: 'NOT_STARTED',
    progressPct: 0,
    completedAt: null,
  };
}

export function findPreviewLesson(
  modules: CmsPreviewModule[],
  lessonId: string,
): (CmsPreviewLesson & { moduleTitle: string; moduleSlug: string }) | undefined {
  for (const mod of modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      return { ...lesson, moduleTitle: mod.title, moduleSlug: mod.slug };
    }
  }
  return undefined;
}

export function firstPreviewLessonId(modules: CmsPreviewModule[]): string | undefined {
  for (const mod of modules) {
    if (mod.lessons.length > 0) {
      return mod.lessons[0]?.id;
    }
  }
  return undefined;
}

export async function getCmsCoursePreview(
  courseId: string,
): Promise<CmsCoursePreviewData | undefined> {
  const [course, version, modules] = await Promise.all([
    getCourseById(courseId),
    getLatestCourseVersionSummary(courseId),
    getCoursePreviewStructure(courseId),
  ]);

  if (!course || !version || !modules) {
    return undefined;
  }

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      status: course.status,
    },
    versionNumber: version.versionNumber,
    versionStatus: version.status,
    modules,
  };
}
