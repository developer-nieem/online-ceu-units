import { prisma } from '@calace/db';
import type { Prisma } from '@calace/db';

import type { CmsCourse, CmsCourseInput, CmsCourseListFilters, CmsPublishStatus } from '../types';
import { attachDbLessonsToCourse } from './lessons-repository';
import {
  DEFAULT_TENANT_SLUG,
  buildCatalogData,
  mapDbCourseToCms,
  mergeCoursePatch,
  slugify,
  toPrismaCourseStatus,
  toPrismaVersionStatus,
} from './mappers';

const courseInclude = {
  versions: {
    where: { deletedAt: null },
    orderBy: { versionNumber: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.CourseInclude;

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error('Default tenant not found. Run `pnpm --filter @calace/db db:seed`.');
  }

  return tenant.id;
}

async function assertUniqueSlug(tenantId: string, slug: string, excludeCourseId?: string) {
  const existing = await prisma.course.findFirst({
    where: {
      tenantId,
      slug,
      deletedAt: null,
      ...(excludeCourseId ? { id: { not: excludeCourseId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`Course slug "${slug}" already exists.`);
  }
}

function applyFilters(courses: CmsCourse[], filters: CmsCourseListFilters): CmsCourse[] {
  let results = courses;

  if (filters.status && filters.status !== 'all') {
    results = results.filter((course) => course.status === filters.status);
  }

  if (filters.category && filters.category !== 'all') {
    results = results.filter((course) => course.category === filters.category);
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    results = results.filter(
      (course) =>
        course.title.toLowerCase().includes(q) ||
        course.slug.toLowerCase().includes(q) ||
        course.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  return results.sort((a, b) => a.title.localeCompare(b.title));
}

export async function listCourses(filters: CmsCourseListFilters = {}): Promise<CmsCourse[]> {
  const tenantId = await getTenantId();
  const rows = await prisma.course.findMany({
    where: { tenantId, deletedAt: null },
    include: courseInclude,
    orderBy: { title: 'asc' },
  });

  return applyFilters(
    await Promise.all(rows.map((row) => attachDbLessonsToCourse(mapDbCourseToCms(row)))),
    filters,
  );
}

export async function listPublishedCourses(
  filters: Omit<CmsCourseListFilters, 'status'> = {},
): Promise<CmsCourse[]> {
  const courses = await listCourses({ ...filters, status: 'published' });
  const active = courses.filter((course) => course.active);
  return Promise.all(active.map((course) => attachDbLessonsToCourse(course, { publishedOnly: true })));
}

export async function getCourseById(id: string): Promise<CmsCourse | undefined> {
  const course = await prisma.course.findFirst({
    where: { id, deletedAt: null },
    include: courseInclude,
  });
  return course ? attachDbLessonsToCourse(mapDbCourseToCms(course)) : undefined;
}

export async function getLatestCourseVersionSummary(
  courseId: string,
): Promise<{ versionNumber: number; status: string } | undefined> {
  const version = await prisma.courseVersion.findFirst({
    where: { courseId, deletedAt: null },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true, status: true },
  });
  return version ?? undefined;
}

export async function getCourseBySlug(slug: string): Promise<CmsCourse | undefined> {
  const tenantId = await getTenantId();
  const course = await prisma.course.findFirst({
    where: { tenantId, slug, deletedAt: null },
    include: courseInclude,
  });
  return course ? attachDbLessonsToCourse(mapDbCourseToCms(course)) : undefined;
}

export async function getPublishedCourseBySlug(slug: string): Promise<CmsCourse | undefined> {
  const tenantId = await getTenantId();
  const course = await prisma.course.findFirst({
    where: { tenantId, slug, deletedAt: null },
    include: courseInclude,
  });

  if (!course) {
    return undefined;
  }

  const cms = mapDbCourseToCms(course);
  if (cms.status !== 'published' || !cms.active) {
    return undefined;
  }

  const withDbLessons = await attachDbLessonsToCourse(cms, { publishedOnly: true });
  return {
    ...withDbLessons,
    lessons:
      withDbLessons.lessons.length > 0
        ? withDbLessons.lessons
        : cms.lessons.filter((lesson) => lesson.status === 'published'),
  };
}

export async function createCourse(input: CmsCourseInput): Promise<CmsCourse> {
  const tenantId = await getTenantId();
  const slug = (input.slug || slugify(input.title)).trim();
  if (!slug) {
    throw new Error('Course slug is required.');
  }

  await assertUniqueSlug(tenantId, slug);

  const publishedAt = input.status === 'published' ? new Date().toISOString() : undefined;
  const catalogData = buildCatalogData({ ...input, slug }, publishedAt);

  const created = await prisma.course.create({
    data: {
      tenantId,
      slug,
      title: input.title,
      summary: input.shortDescription,
      status: toPrismaCourseStatus(input.status),
      ceHours: input.ceUnits,
      catalogData: catalogData as unknown as Prisma.InputJsonValue,
      versions: {
        create: {
          versionNumber: 1,
          label: 'Version 1',
          status: toPrismaVersionStatus(input.status),
          ceHours: input.ceUnits,
          publishedAt: input.status === 'published' ? new Date() : null,
          contentMeta: { source: 'cms' },
        },
      },
    },
    include: courseInclude,
  });

  return attachDbLessonsToCourse(mapDbCourseToCms(created));
}

export async function updateCourse(id: string, patch: Partial<CmsCourseInput>): Promise<CmsCourse> {
  const existing = await getCourseById(id);
  if (!existing) {
    throw new Error(`Course "${id}" not found.`);
  }

  const tenantId = await getTenantId();
  const merged = mergeCoursePatch(existing, patch);
  const slug = (merged.slug || slugify(merged.title)).trim();
  if (!slug) {
    throw new Error('Course slug is required.');
  }

  if (slug !== existing.slug) {
    await assertUniqueSlug(tenantId, slug, id);
  }

  const nextStatus = merged.status;
  const publishedAt =
    nextStatus === 'published'
      ? existing.publishedAt ?? new Date().toISOString()
      : nextStatus === 'draft'
        ? undefined
        : existing.publishedAt;

  const catalogData = buildCatalogData({ ...merged, slug }, publishedAt);

  const updated = await prisma.course.update({
    where: { id },
    data: {
      slug,
      title: merged.title,
      summary: merged.shortDescription,
      status: toPrismaCourseStatus(nextStatus),
      ceHours: merged.ceUnits,
      catalogData: catalogData as unknown as Prisma.InputJsonValue,
    },
    include: courseInclude,
  });

  const version = updated.versions[0];
  if (version) {
    await prisma.courseVersion.update({
      where: { id: version.id },
      data: {
        status: toPrismaVersionStatus(nextStatus),
        ceHours: merged.ceUnits,
        publishedAt:
          nextStatus === 'published'
            ? version.publishedAt ?? new Date()
            : nextStatus === 'draft'
              ? null
              : version.publishedAt,
      },
    });
  }

  const refreshed = await getCourseById(id);
  if (!refreshed) {
    throw new Error(`Course "${id}" not found after update.`);
  }
  return refreshed;
}

export async function setCourseStatus(id: string, status: CmsPublishStatus): Promise<CmsCourse> {
  return updateCourse(id, { status });
}

export async function archiveCourse(id: string): Promise<CmsCourse> {
  return setCourseStatus(id, 'archived');
}
