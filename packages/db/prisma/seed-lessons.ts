import { ContentPublishStatus, type PrismaClient } from '@prisma/client';

const DEFAULT_MODULE_SLUG = 'main';

type SeedLesson = Record<string, unknown>;

function toContentStatus(status: unknown): ContentPublishStatus {
  if (status === 'published') return ContentPublishStatus.PUBLISHED;
  if (status === 'archived') return ContentPublishStatus.ARCHIVED;
  return ContentPublishStatus.DRAFT;
}

function buildLessonContent(seed: SeedLesson) {
  const readingBlocks =
    (seed.readingBlocks as Array<{ title?: string; content?: string }>) ?? [];
  const bodyFromBlocks = readingBlocks
    .map((block) => [block.title, block.content].filter(Boolean).join('\n\n'))
    .filter(Boolean)
    .join('\n\n');
  const body =
    bodyFromBlocks || (seed.contentSummary as string) || (seed.body as string) || '';
  const hasVideo = Boolean(seed.videoUrl);

  return {
    type: hasVideo ? 'video' : 'text',
    title: seed.title as string,
    body,
    videoUrl: seed.videoUrl,
    requiredForCompletion: seed.requiredForCompletion ?? true,
    completionRule: seed.completionRule ?? 'view_all',
    readingBlocks: seed.readingBlocks ?? [],
    interactionBlocks: seed.interactionBlocks ?? [],
    quizBlocks: seed.quizBlocks ?? [],
    legacySeedId: seed.id,
  };
}

export async function seedCourseLessons(
  prisma: PrismaClient,
  courseId: string,
  catalogLessons: SeedLesson[],
): Promise<number> {
  const version = await prisma.courseVersion.findFirst({
    where: { courseId, versionNumber: 1, deletedAt: null },
    select: { id: true },
  });

  if (!version) {
    return 0;
  }

  const module = await prisma.module.upsert({
    where: {
      courseVersionId_slug: {
        courseVersionId: version.id,
        slug: DEFAULT_MODULE_SLUG,
      },
    },
    create: {
      courseVersionId: version.id,
      slug: DEFAULT_MODULE_SLUG,
      title: 'Course Content',
      sortOrder: 1,
      status: ContentPublishStatus.PUBLISHED,
    },
    update: {
      deletedAt: null,
      status: ContentPublishStatus.PUBLISHED,
    },
  });

  let count = 0;

  for (const seed of catalogLessons) {
    const slug = seed.slug as string;
    const content = buildLessonContent(seed);

    await prisma.lesson.upsert({
      where: {
        moduleId_slug: {
          moduleId: module.id,
          slug,
        },
      },
      create: {
        moduleId: module.id,
        slug,
        title: seed.title as string,
        description: (seed.contentSummary as string) ?? null,
        sortOrder: seed.sortOrder as number,
        status: toContentStatus(seed.status),
        durationMinutes: seed.estimatedMinutes as number | undefined,
        content,
      },
      update: {
        title: seed.title as string,
        description: (seed.contentSummary as string) ?? null,
        sortOrder: seed.sortOrder as number,
        status: toContentStatus(seed.status),
        durationMinutes: seed.estimatedMinutes as number | undefined,
        content,
        deletedAt: null,
      },
    });

    count += 1;
  }

  return count;
}
