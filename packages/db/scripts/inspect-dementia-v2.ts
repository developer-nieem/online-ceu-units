/**
 * READ-ONLY inspection: dementia-care course v2 DRAFT vs v1 PUBLISHED structure.
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-dementia-v2.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'dementia-care';

async function inspectVersion(courseId: string, versionNumber: number) {
  return prisma.courseVersion.findFirst({
    where: {
      courseId,
      versionNumber,
      deletedAt: null,
    },
    select: {
      versionNumber: true,
      status: true,
      modules: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          slug: true,
          lessons: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      },
    },
  });
}

async function main(): Promise<void> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: TENANT_SLUG, deletedAt: null },
    select: { id: true, slug: true },
  });

  if (!tenant) {
    console.log(`Tenant not found: slug="${TENANT_SLUG}"`);
    return;
  }

  const course = await prisma.course.findFirst({
    where: {
      tenantId: tenant.id,
      slug: COURSE_SLUG,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  console.log('=== Course (dementia-care, tenant cal-ace) ===');

  if (!course) {
    console.log(`Course not found: slug="${COURSE_SLUG}"`);
    return;
  }

  console.log(`id:     ${course.id}`);
  console.log(`title:  ${course.title}`);
  console.log(`status: ${course.status}`);
  console.log('');

  for (const versionNumber of [2, 1] as const) {
    const version = await inspectVersion(course.id, versionNumber);

    console.log(`=== CourseVersion v${versionNumber} ===`);

    if (!version) {
      console.log('(not found)');
      console.log('');
      continue;
    }

    const moduleCount = version.modules.length;
    const totalLessons = version.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0,
    );

    console.log(`versionNumber: ${version.versionNumber}`);
    console.log(`status:        ${version.status}`);
    console.log(`moduleCount:   ${moduleCount}`);
    console.log(`lessonCount:   ${totalLessons}`);

    if (versionNumber === 2) {
      console.log('modules:');
      for (const mod of version.modules) {
        console.log(`  ${mod.slug} — ${mod.lessons.length} lessons`);
      }
    }

    console.log('');
  }
}

main()
  .catch((error: unknown) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
