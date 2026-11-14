/**
 * READ-ONLY inspection: verify sepsis-recognition course v1 after seed.
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-sepsis-v1.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const SEPSIS_SLUG = 'sepsis-recognition';
const OLD_SLUG = 'infection-control-prevention';

async function main(): Promise<void> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: TENANT_SLUG, deletedAt: null },
    select: { id: true, slug: true },
  });

  if (!tenant) {
    console.log(`Tenant not found: slug="${TENANT_SLUG}"`);
    return;
  }

  // -------------------------------------------------------------------------
  // Sepsis course
  // -------------------------------------------------------------------------
  console.log(`=== Course: "${SEPSIS_SLUG}" (tenant ${TENANT_SLUG}) ===`);

  const course = await prisma.course.findFirst({
    where: {
      tenantId: tenant.id,
      slug: SEPSIS_SLUG,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      status: true,
      ceHours: true,
      categoryId: true,
      professionId: true,
      catalogData: true,
      category: { select: { slug: true } },
      profession: { select: { code: true } },
    },
  });

  if (!course) {
    console.log(`NOT FOUND: slug="${SEPSIS_SLUG}"`);
  } else {
    console.log(`id:           ${course.id}`);
    console.log(`title:        ${course.title}`);
    console.log(`status:       ${course.status}`);
    console.log(`ceHours:      ${course.ceHours.toString()}`);
    console.log(
      `categoryId:   ${course.categoryId ?? 'null'} (slug: ${course.category?.slug ?? 'null'})`,
    );
    console.log(
      `professionId: ${course.professionId ?? 'null'} (code: ${course.profession?.code ?? 'null'})`,
    );
    console.log('catalogData:');
    console.log(JSON.stringify(course.catalogData, null, 2));
  }
  console.log('');

  // -------------------------------------------------------------------------
  // v1 structure
  // -------------------------------------------------------------------------
  console.log('=== CourseVersion v1 ===');

  if (course) {
    const version = await prisma.courseVersion.findFirst({
      where: {
        courseId: course.id,
        versionNumber: 1,
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

    if (!version) {
      console.log('(not found)');
    } else {
      const moduleCount = version.modules.length;
      const lessonCount = version.modules.reduce(
        (sum, mod) => sum + mod.lessons.length,
        0,
      );

      console.log(`versionNumber: ${version.versionNumber}`);
      console.log(`status:        ${version.status}`);
      console.log(`moduleCount:   ${moduleCount}`);
      console.log(`lessonCount:   ${lessonCount}`);
      console.log('modules:');
      for (const mod of version.modules) {
        console.log(`  ${mod.slug} — ${mod.lessons.length} lessons`);
      }
    }
  } else {
    console.log('(skipped — course not found)');
  }
  console.log('');

  // -------------------------------------------------------------------------
  // Old course unchanged
  // -------------------------------------------------------------------------
  console.log(`=== Old course (unchanged): "${OLD_SLUG}" ===`);

  const oldCourse = await prisma.course.findFirst({
    where: {
      tenantId: tenant.id,
      slug: OLD_SLUG,
      deletedAt: null,
    },
    select: {
      status: true,
      versions: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });

  if (!oldCourse) {
    console.log(`NOT FOUND: slug="${OLD_SLUG}"`);
  } else {
    console.log(`status:       ${oldCourse.status}`);
    console.log(`versionCount: ${oldCourse.versions.length}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
