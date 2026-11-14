import { CMS_SEED_COURSES, type CmsSeedCourse } from '../src/cms-seed-data';
import { CourseStatus, CourseVersionStatus, type PrismaClient } from '@prisma/client';

function toCourseStatus(status: CmsSeedCourse['status']): CourseStatus {
  switch (status) {
    case 'published':
      return CourseStatus.PUBLISHED;
    case 'archived':
      return CourseStatus.ARCHIVED;
    default:
      return CourseStatus.DRAFT;
  }
}

function buildCatalogData(seed: CmsSeedCourse) {
  return {
    fullDescription: seed.fullDescription,
    deliveryMethod: seed.deliveryMethod,
    estimatedSeatTimeMinutes: seed.estimatedSeatTimeMinutes,
    category: seed.category,
    active: seed.active,
    certificateEligible: seed.certificateEligible,
    finalExamRequired: seed.finalExamRequired,
    passingScorePercent: seed.passingScorePercent,
    thumbnailUrl: seed.thumbnailUrl,
    complianceNotes: seed.complianceNotes,
    cdphNotes: seed.cdphNotes,
    instructor: seed.instructor,
    tags: seed.tags,
    lessons: seed.lessons,
    pricing: seed.pricing,
    aiMetadata: seed.aiMetadata,
    publishedAt: seed.publishedAt,
    legacySeedId: seed.id,
  };
}

export async function seedCmsCourses(
  prisma: PrismaClient,
  tenantId: string,
  professionId: string,
): Promise<number> {
  let count = 0;

  for (const seed of CMS_SEED_COURSES) {
    const catalogData = buildCatalogData(seed);
    const status = toCourseStatus(seed.status);

    const course = await prisma.course.upsert({
      where: {
        tenantId_slug: { tenantId, slug: seed.slug },
      },
      create: {
        tenantId,
        professionId,
        slug: seed.slug,
        title: seed.title,
        summary: seed.shortDescription,
        status,
        ceHours: seed.ceUnits,
        catalogData,
        createdAt: new Date(seed.createdAt),
        updatedAt: new Date(seed.updatedAt),
      },
      update: {
        title: seed.title,
        summary: seed.shortDescription,
        status,
        ceHours: seed.ceUnits,
        catalogData,
        updatedAt: new Date(seed.updatedAt),
        deletedAt: null,
      },
    });

    await prisma.courseVersion.upsert({
      where: {
        courseId_versionNumber: { courseId: course.id, versionNumber: 1 },
      },
      create: {
        courseId: course.id,
        versionNumber: 1,
        label: 'Version 1',
        status: status === CourseStatus.PUBLISHED ? CourseVersionStatus.PUBLISHED : CourseVersionStatus.DRAFT,
        ceHours: seed.ceUnits,
        publishedAt: seed.publishedAt ? new Date(seed.publishedAt) : null,
        contentMeta: { source: 'cms-seed' },
      },
      update: {
        status: status === CourseStatus.PUBLISHED ? CourseVersionStatus.PUBLISHED : CourseVersionStatus.DRAFT,
        ceHours: seed.ceUnits,
        publishedAt: seed.publishedAt ? new Date(seed.publishedAt) : null,
      },
    });

    count += 1;

    const { seedCourseLessons } = await import('./seed-lessons');
    await seedCourseLessons(prisma, course.id, seed.lessons);

    const { seedCourseAssessments } = await import('./seed-assessments');
    await seedCourseAssessments(prisma, course.id, seed.slug);
  }

  return count;
}
