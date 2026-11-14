/**
 * READ-ONLY preview: modules/lessons that would be removed from
 * communication-skills v4 (DRAFT) to clean up leftover stub content.
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/preview-v4-cleanup.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'communication-skills';
const TARGET_VERSION_NUMBER = 4;
const STUB_MODULE_SLUGS = ['therapeutic-comm', 'team-comm'] as const;
const KEEP_MODULE_SLUGS = ['module-1', 'module-2', 'module-3'] as const;

async function main(): Promise<void> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: TENANT_SLUG, deletedAt: null },
    select: { id: true, slug: true },
  });

  if (!tenant) {
    console.log(`WARNING: Tenant not found: slug="${TENANT_SLUG}"`);
    return;
  }

  const course = await prisma.course.findFirst({
    where: { tenantId: tenant.id, slug: COURSE_SLUG, deletedAt: null },
    select: { id: true, slug: true, title: true },
  });

  if (!course) {
    console.log(`WARNING: Course not found: slug="${COURSE_SLUG}" (tenant ${TENANT_SLUG})`);
    return;
  }

  console.log('=== Target course ===');
  console.log(`tenant: ${tenant.slug} (${tenant.id})`);
  console.log(`course: ${course.title} (${course.slug}, id=${course.id})`);
  console.log('');

  const v4 = await prisma.courseVersion.findFirst({
    where: {
      courseId: course.id,
      versionNumber: TARGET_VERSION_NUMBER,
      deletedAt: null,
    },
    select: {
      id: true,
      versionNumber: true,
      status: true,
    },
  });

  console.log('=== Target version (v4) ===');

  if (!v4) {
    console.log(`WARNING: CourseVersion v${TARGET_VERSION_NUMBER} not found. STOP.`);
    return;
  }

  console.log(`id:             ${v4.id}`);
  console.log(`versionNumber:  ${v4.versionNumber}`);
  console.log(`status:         ${v4.status}`);

  if (v4.status !== 'DRAFT') {
    console.log('');
    console.log(`WARNING: Expected status DRAFT but found ${v4.status}. STOP.`);
    return;
  }

  console.log('Confirmed: v4 is DRAFT.');
  console.log('');

  const v3 = await prisma.courseVersion.findFirst({
    where: {
      courseId: course.id,
      versionNumber: 3,
      deletedAt: null,
    },
    select: {
      id: true,
      versionNumber: true,
      status: true,
    },
  });

  const allV4Modules = await prisma.module.findMany({
    where: {
      courseVersionId: v4.id,
      deletedAt: null,
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      courseVersionId: true,
      lessons: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  console.log(`=== All modules on v4 (${allV4Modules.length}) ===`);
  for (const mod of allV4Modules) {
    console.log(
      `  ${mod.slug} | id=${mod.id} | title="${mod.title}" | lessons=${mod.lessons.length}`,
    );
  }
  console.log('');

  const deleteTargets = allV4Modules.filter((mod) =>
    (STUB_MODULE_SLUGS as readonly string[]).includes(mod.slug),
  );

  console.log(`=== Modules to DELETE (stub slugs on v4 only: ${STUB_MODULE_SLUGS.join(', ')}) ===`);
  if (deleteTargets.length === 0) {
    console.log('  (none found)');
  } else {
    for (const mod of deleteTargets) {
      console.log(`  slug: ${mod.slug}`);
      console.log(`  id:   ${mod.id}`);
      console.log(`  title: "${mod.title}"`);
      console.log(`  courseVersionId: ${mod.courseVersionId} (v4)`);
      console.log('  lessons:');
      for (const lesson of mod.lessons) {
        console.log(`    - ${lesson.slug} | id=${lesson.id}`);
      }
      console.log('');
    }
  }

  const keepModules = allV4Modules.filter((mod) =>
    (KEEP_MODULE_SLUGS as readonly string[]).includes(mod.slug),
  );

  console.log(`=== Modules to KEEP (aphasia: ${KEEP_MODULE_SLUGS.join(', ')}) ===`);
  if (keepModules.length === 0) {
    console.log('  (none found)');
  } else {
    for (const mod of keepModules) {
      console.log(
        `  ${mod.slug} | id=${mod.id} | title="${mod.title}" | lessons=${mod.lessons.length}`,
      );
      for (const lesson of mod.lessons) {
        console.log(`    - ${lesson.slug} | id=${lesson.id}`);
      }
    }
  }
  console.log('');

  const deleteLessonCount = deleteTargets.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const keepLessonCount = keepModules.reduce((sum, mod) => sum + mod.lessons.length, 0);

  console.log('=== Summary ===');
  console.log(`WILL DELETE: ${deleteTargets.length} modules, ${deleteLessonCount} lessons`);
  console.log(`WILL KEEP: ${keepModules.length} modules, ${keepLessonCount} lessons`);
  console.log('');

  console.log('=== Cross-check: v4-only deletion targets vs v3 (must NOT overlap) ===');
  console.log(`v4 courseVersionId: ${v4.id}`);

  if (!v3) {
    console.log('WARNING: v3 not found — cannot cross-check against published version.');
  } else {
    console.log(`v3 courseVersionId: ${v3.id} (status=${v3.status})`);

    const v3StubModules = await prisma.module.findMany({
      where: {
        courseVersionId: v3.id,
        slug: { in: [...STUB_MODULE_SLUGS] },
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        courseVersionId: true,
      },
    });

    console.log('');
    console.log(`v3 modules with same stub slugs (${v3StubModules.length}):`);
    for (const mod of v3StubModules) {
      console.log(`  ${mod.slug} | id=${mod.id} | title="${mod.title}" | courseVersionId=${mod.courseVersionId}`);
    }

    const v4DeleteIds = new Set(deleteTargets.map((m) => m.id));
    const overlap = v3StubModules.filter((m) => v4DeleteIds.has(m.id));

    console.log('');
    if (overlap.length > 0) {
      console.log('WARNING: v3 module ids appear in v4 deletion list — STOP, scope error!');
      for (const mod of overlap) {
        console.log(`  OVERLAP: ${mod.slug} id=${mod.id}`);
      }
    } else {
      console.log('OK: No v3 module ids in deletion target list.');
      console.log('OK: All deletion targets have courseVersionId = v4 id.');
      const allOnV4 = deleteTargets.every((m) => m.courseVersionId === v4.id);
      if (!allOnV4) {
        console.log('WARNING: Some deletion targets are NOT on v4 courseVersionId!');
      }
      for (const v4Mod of deleteTargets) {
        const v3Match = v3StubModules.find((m) => m.slug === v4Mod.slug);
        if (v3Match) {
          console.log(
            `  ${v4Mod.slug}: v4 id=${v4Mod.id} vs v3 id=${v3Match.id} (different — v3 safe)`,
          );
        }
      }
    }
  }

  const unexpectedModules = allV4Modules.filter(
    (mod) =>
      !(STUB_MODULE_SLUGS as readonly string[]).includes(mod.slug) &&
      !(KEEP_MODULE_SLUGS as readonly string[]).includes(mod.slug),
  );

  if (unexpectedModules.length > 0) {
    console.log('');
    console.log('=== Ambiguous modules (neither stub nor aphasia) ===');
    for (const mod of unexpectedModules) {
      console.log(`  ${mod.slug} | id=${mod.id} | title="${mod.title}"`);
    }
    console.log('WARNING: Unexpected modules present — review before cleanup.');
  }
}

main()
  .catch((error: unknown) => {
    console.error('Preview failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
