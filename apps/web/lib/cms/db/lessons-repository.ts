import { validateCmsLessonVideoInteractionPair } from '@calace/content-blocks';
import { ContentPublishStatus, prisma } from '@calace/db';
import type { Prisma } from '@calace/db';

import type { CmsLesson, CmsPublishStatus } from '../types';
import {
  DEFAULT_MODULE_SLUG,
  buildLessonContent,
  cmsLessonFromSeed,
  fromContentPublishStatus,
  mapDbLessonToCms,
  toContentPublishStatus,
  type CmsLessonInput,
} from './lesson-mappers';

const lessonInclude = {
  module: {
    select: {
      courseVersion: {
        select: { courseId: true },
      },
    },
  },
} satisfies Prisma.LessonInclude;

async function getLatestCourseVersionId(courseId: string): Promise<string> {
  const version = await prisma.courseVersion.findFirst({
    where: { courseId, deletedAt: null },
    orderBy: { versionNumber: 'desc' },
    select: { id: true },
  });

  if (!version) {
    throw new Error(`Course version not found for course "${courseId}".`);
  }

  return version.id;
}

export async function getOrCreateDefaultModule(courseId: string) {
  const courseVersionId = await getLatestCourseVersionId(courseId);

  return prisma.module.upsert({
    where: {
      courseVersionId_slug: {
        courseVersionId,
        slug: DEFAULT_MODULE_SLUG,
      },
    },
    create: {
      courseVersionId,
      slug: DEFAULT_MODULE_SLUG,
      title: 'Course Content',
      sortOrder: 1,
      status: ContentPublishStatus.PUBLISHED,
    },
    update: {
      deletedAt: null,
    },
  });
}

export async function listLessonsForCourse(
  courseId: string,
  options: { publishedOnly?: boolean } = {},
): Promise<CmsLesson[]> {
  const courseVersionId = await getLatestCourseVersionId(courseId);

  const modules = await prisma.module.findMany({
    where: { courseVersionId, deletedAt: null },
    select: { id: true },
  });

  if (modules.length === 0) {
    return [];
  }

  const rows = await prisma.lesson.findMany({
    where: {
      moduleId: { in: modules.map((module) => module.id) },
      deletedAt: null,
      ...(options.publishedOnly ? { status: ContentPublishStatus.PUBLISHED } : {}),
    },
    orderBy: { sortOrder: 'asc' },
  });

  return rows.map((row) => mapDbLessonToCms(row, courseId));
}

export async function getLessonById(lessonId: string): Promise<CmsLesson | undefined> {
  const row = await prisma.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    include: lessonInclude,
  });

  if (!row) {
    return undefined;
  }

  const courseId = row.module.courseVersion.courseId;
  return mapDbLessonToCms(row, courseId);
}

export async function getLessonBySlug(
  courseId: string,
  lessonSlug: string,
  options: { publishedOnly?: boolean } = {},
): Promise<CmsLesson | undefined> {
  const courseVersionId = await getLatestCourseVersionId(courseId);

  const row = await prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      deletedAt: null,
      ...(options.publishedOnly ? { status: ContentPublishStatus.PUBLISHED } : {}),
      module: {
        courseVersionId,
        deletedAt: null,
      },
    },
  });

  return row ? mapDbLessonToCms(row, courseId) : undefined;
}

async function assertUniqueLessonSlug(moduleId: string, slug: string, excludeLessonId?: string) {
  const existing = await prisma.lesson.findFirst({
    where: {
      moduleId,
      slug,
      deletedAt: null,
      ...(excludeLessonId ? { id: { not: excludeLessonId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`Lesson slug "${slug}" already exists for this course.`);
  }
}

export async function createLesson(courseId: string, input: CmsLessonInput): Promise<CmsLesson> {
  const moduleRecord = await getOrCreateDefaultModule(courseId);
  const slug = input.slug.trim();

  if (!slug) {
    throw new Error('Lesson slug is required.');
  }

  await assertUniqueLessonSlug(moduleRecord.id, slug);

  const formatCheck = validateCmsLessonVideoInteractionPair(input);
  if (!formatCheck.valid) {
    throw new Error(formatCheck.errors.join(' '));
  }

  const content = buildLessonContent(input);
  const maxSort = await prisma.lesson.aggregate({
    where: { moduleId: moduleRecord.id, deletedAt: null },
    _max: { sortOrder: true },
  });

  const row = await prisma.lesson.create({
    data: {
      moduleId: moduleRecord.id,
      slug,
      title: input.title,
      description: input.contentSummary,
      sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      status: toContentPublishStatus(input.status),
      durationMinutes: input.estimatedMinutes,
      content: content as unknown as Prisma.InputJsonValue,
    },
  });

  return mapDbLessonToCms(row, courseId);
}

export async function updateLesson(
  lessonId: string,
  patch: Partial<CmsLessonInput>,
): Promise<CmsLesson> {
  const existing = await prisma.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    include: lessonInclude,
  });

  if (!existing) {
    throw new Error(`Lesson "${lessonId}" not found.`);
  }

  const courseId = existing.module.courseVersion.courseId;
  const current = mapDbLessonToCms(existing, courseId);
  const merged: CmsLessonInput = {
    ...current,
    ...patch,
    readingBlocks: patch.readingBlocks ?? current.readingBlocks,
    interactionBlocks: patch.interactionBlocks ?? current.interactionBlocks,
    quizBlocks: patch.quizBlocks ?? current.quizBlocks,
  };

  const slug = (merged.slug || current.slug).trim();
  if (slug !== current.slug) {
    await assertUniqueLessonSlug(existing.moduleId, slug, lessonId);
  }

  const formatCheck = validateCmsLessonVideoInteractionPair(merged);
  if (!formatCheck.valid) {
    throw new Error(formatCheck.errors.join(' '));
  }

  const row = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      slug,
      title: merged.title,
      description: merged.contentSummary,
      sortOrder: merged.sortOrder,
      status: toContentPublishStatus(merged.status),
      durationMinutes: merged.estimatedMinutes,
      content: buildLessonContent(merged) as unknown as Prisma.InputJsonValue,
    },
  });

  return mapDbLessonToCms(row, courseId);
}

export async function setLessonStatus(lessonId: string, status: CmsPublishStatus): Promise<CmsLesson> {
  return updateLesson(lessonId, { status });
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { deletedAt: new Date() },
  });
}

export async function syncLessonsFromCatalog(
  courseId: string,
  catalogLessons: Array<Record<string, unknown>>,
): Promise<number> {
  const moduleRecord = await getOrCreateDefaultModule(courseId);
  let count = 0;

  for (const seed of catalogLessons) {
    const input = cmsLessonFromSeed(seed, courseId);
    const content = buildLessonContent(input);

    await prisma.lesson.upsert({
      where: {
        moduleId_slug: {
          moduleId: moduleRecord.id,
          slug: input.slug,
        },
      },
      create: {
        moduleId: moduleRecord.id,
        slug: input.slug,
        title: input.title,
        description: input.contentSummary,
        sortOrder: input.sortOrder,
        status: toContentPublishStatus(input.status),
        durationMinutes: input.estimatedMinutes,
        content: content as unknown as Prisma.InputJsonValue,
      },
      update: {
        title: input.title,
        description: input.contentSummary,
        sortOrder: input.sortOrder,
        status: toContentPublishStatus(input.status),
        durationMinutes: input.estimatedMinutes,
        content: content as unknown as Prisma.InputJsonValue,
        deletedAt: null,
      },
    });

    count += 1;
  }

  return count;
}

export async function attachDbLessonsToCourse<T extends { id: string; lessons: CmsLesson[] }>(
  course: T,
  options: { publishedOnly?: boolean } = {},
): Promise<T> {
  const dbLessons = await listLessonsForCourse(course.id, options);
  if (dbLessons.length === 0) {
    return course;
  }
  return { ...course, lessons: dbLessons };
}

export type CmsPreviewLesson = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  status: CmsPublishStatus;
  durationMinutes: number | null;
  content: unknown;
};

export type CmsPreviewModule = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  lessons: CmsPreviewLesson[];
};

export async function getCoursePreviewStructure(
  courseId: string,
): Promise<CmsPreviewModule[] | undefined> {
  let courseVersionId: string;
  try {
    courseVersionId = await getLatestCourseVersionId(courseId);
  } catch {
    return undefined;
  }

  const modules = await prisma.module.findMany({
    where: { courseVersionId, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      lessons: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          sortOrder: true,
          status: true,
          durationMinutes: true,
          content: true,
        },
      },
    },
  });

  return modules.map((mod) => ({
    id: mod.id,
    slug: mod.slug,
    title: mod.title,
    sortOrder: mod.sortOrder,
    lessons: mod.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      sortOrder: lesson.sortOrder,
      status: fromContentPublishStatus(lesson.status),
      durationMinutes: lesson.durationMinutes,
      content: lesson.content,
    })),
  }));
}
