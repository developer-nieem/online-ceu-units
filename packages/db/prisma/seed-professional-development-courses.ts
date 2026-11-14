/**
 * Bulk-create Professional Development courses (idempotent upserts).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-professional-development-courses
 *
 * Add more courses in src/professional-development-bulk-courses.ts, then re-run.
 */
import {
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { createEmptyLessonDocument } from '@calace/content-blocks';

import { DEFAULT_LAUNCH_CEU_HOURS } from '../src/ceu-defaults';
import { mergeLaunchCatalogData } from '../src/launch-catalog';
import {
  PROFESSIONAL_DEVELOPMENT_BULK_COURSES,
  type ProfessionalDevelopmentBulkCourse,
} from '../src/professional-development-bulk-courses';

const TENANT_SLUG = 'cal-ace';
const CATEGORY_SLUG = 'professional-development';
const PROFESSION_CODE = 'CNA';

const DEFAULT_CATALOG = {
  price: 3.75,
  durationMinutes: 60,
  difficulty: 'intermediate',
  instructor: 'CAL ACE Faculty',
  featured: false,
  hasFreePreview: false,
  subscriptionEligible: true,
};

const DEFAULT_CONTENT_META = {
  overview: '',
  learningObjectives: [] as string[],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',
    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'teal',
  versioning: { immutableAfterPublish: true },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function ensurePublishedScaffold(
  prisma: PrismaClient,
  courseVersionId: string,
): Promise<void> {
  const module = await prisma.module.upsert({
    where: {
      courseVersionId_slug: { courseVersionId, slug: 'module-1' },
    },
    create: {
      courseVersionId,
      slug: 'module-1',
      title: 'Module 1',
      sortOrder: 0,
      status: ContentPublishStatus.PUBLISHED,
    },
    update: {
      status: ContentPublishStatus.PUBLISHED,
      deletedAt: null,
    },
  });

  await prisma.lesson.upsert({
    where: {
      moduleId_slug: { moduleId: module.id, slug: 'lesson-1' },
    },
    create: {
      moduleId: module.id,
      slug: 'lesson-1',
      title: 'Introduction',
      sortOrder: 0,
      status: ContentPublishStatus.PUBLISHED,
      durationMinutes: 15,
      content: createEmptyLessonDocument('Introduction') as Prisma.InputJsonValue,
    },
    update: {
      status: ContentPublishStatus.PUBLISHED,
      deletedAt: null,
    },
  });

}

export async function seedProfessionalDevelopmentCourses(
  prisma: PrismaClient,
  options?: { tenantSlug?: string; courses?: ProfessionalDevelopmentBulkCourse[] },
): Promise<{ created: number; updated: number }> {
  const tenantSlug = options?.tenantSlug ?? TENANT_SLUG;
  const courses = options?.courses ?? PROFESSIONAL_DEVELOPMENT_BULK_COURSES;

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, deletedAt: null },
  });
  if (!tenant) {
    throw new Error(`Tenant "${tenantSlug}" not found. Run db:seed first.`);
  }

  const category = await prisma.courseCategory.findFirst({
    where: { tenantId: tenant.id, slug: CATEGORY_SLUG, deletedAt: null },
  });
  if (!category) {
    throw new Error(
      `Category "${CATEGORY_SLUG}" not found for tenant "${tenantSlug}". Run db:seed first.`,
    );
  }

  const profession = await prisma.profession.findFirst({
    where: { code: PROFESSION_CODE },
  });

  const ceHours = DEFAULT_LAUNCH_CEU_HOURS;
  const catalogData = mergeLaunchCatalogData(DEFAULT_CATALOG, ceHours);
  const now = new Date();

  let created = 0;
  let updated = 0;

  const slugs = new Set<string>();
  for (const entry of courses) {
    const slug = entry.slug?.trim() || slugify(entry.title);
    if (slugs.has(slug)) {
      throw new Error(`Duplicate course slug in bulk seed data: ${slug}`);
    }
    slugs.add(slug);

    const existing = await prisma.course.findFirst({
      where: { tenantId: tenant.id, slug },
    });

    const contentMeta = {
      ...DEFAULT_CONTENT_META,
      overview: entry.summary,
    };

    const course = await prisma.course.upsert({
      where: {
        tenantId_slug: { tenantId: tenant.id, slug },
      },
      create: {
        tenantId: tenant.id,
        categoryId: category.id,
        professionId: profession?.id,
        slug,
        title: entry.title,
        summary: entry.summary,
        status: CourseStatus.PUBLISHED,
        ceHours,
        catalogData: catalogData as Prisma.InputJsonValue,
      },
      update: {
        categoryId: category.id,
        professionId: profession?.id,
        title: entry.title,
        summary: entry.summary,
        status: CourseStatus.PUBLISHED,
        ceHours,
        catalogData: catalogData as Prisma.InputJsonValue,
        deletedAt: null,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }

    const version = await prisma.courseVersion.upsert({
      where: {
        courseId_versionNumber: { courseId: course.id, versionNumber: 1 },
      },
      create: {
        courseId: course.id,
        versionNumber: 1,
        label: 'Initial release',
        status: CourseVersionStatus.PUBLISHED,
        ceHours,
        publishedAt: now,
        contentMeta: contentMeta as Prisma.InputJsonValue,
      },
      update: {
        status: CourseVersionStatus.PUBLISHED,
        ceHours,
        publishedAt: now,
        contentMeta: contentMeta as Prisma.InputJsonValue,
        deletedAt: null,
      },
    });

    await ensurePublishedScaffold(prisma, version.id);
  }

  return { created, updated };
}

async function main() {
  const prisma = new PrismaClient();
  console.log(
    `Seeding ${PROFESSIONAL_DEVELOPMENT_BULK_COURSES.length} Professional Development courses…`,
  );

  try {
    const result = await seedProfessionalDevelopmentCourses(prisma);
    console.log('Seed complete.');
    console.log(`  Created: ${result.created}`);
    console.log(`  Updated: ${result.updated}`);
    console.log(`  Category: Professional Development (${CATEGORY_SLUG})`);
    console.log(`  Status:   Published`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
