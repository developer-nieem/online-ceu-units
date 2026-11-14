/**
 * READ-ONLY inspection: identify the live DB identity for Course-3 falls/immobility seed target
 * (former "Mobility & Transfer Safety").
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-falls-target.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const SEARCH_TERMS = [
  'mobility',
  'transfer',
  'fall',
  'immobility',
  'deconditioning',
] as const;

async function main(): Promise<void> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: TENANT_SLUG, deletedAt: null },
    select: { id: true, slug: true, name: true },
  });

  if (!tenant) {
    console.log(`Tenant not found: slug="${TENANT_SLUG}"`);
    return;
  }

  console.log('=== Tenant ===');
  console.log(`id:   ${tenant.id}`);
  console.log(`slug: ${tenant.slug}`);
  console.log(`name: ${tenant.name}`);
  console.log('');

  const courses = await prisma.course.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
      OR: SEARCH_TERMS.flatMap((term) => [
        { slug: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
      ]),
    },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      versions: {
        where: { deletedAt: null },
        orderBy: { versionNumber: 'asc' },
        select: {
          versionNumber: true,
          status: true,
          publishedAt: true,
        },
      },
    },
  });

  console.log(
    '=== Matching courses (slug/title contains mobility | transfer | fall | immobility | deconditioning) ===',
  );
  console.log(`count: ${courses.length}`);
  console.log('');

  if (courses.length === 0) {
    return;
  }

  for (const course of courses) {
    const maxVersion =
      course.versions.length > 0
        ? Math.max(...course.versions.map((v) => v.versionNumber))
        : null;

    console.log('--- Course ---');
    console.log(`id:     ${course.id}`);
    console.log(`slug:   ${course.slug}`);
    console.log(`title:  ${course.title}`);
    console.log(`status: ${course.status}`);

    if (course.versions.length === 0) {
      console.log('versions: (none)');
      console.log('MAX versionNumber: (none)');
    } else {
      console.log('versions:');
      for (const version of course.versions) {
        const marker =
          version.versionNumber === maxVersion ? '  <-- MAX' : '';
        console.log(
          `  v${version.versionNumber} | status=${version.status} | publishedAt=${version.publishedAt?.toISOString() ?? 'null'}${marker}`,
        );
      }
      console.log(`MAX versionNumber: ${maxVersion}`);
    }

    if (maxVersion !== null) {
      const maxVersionDetail = await prisma.courseVersion.findFirst({
        where: {
          courseId: course.id,
          versionNumber: maxVersion,
          deletedAt: null,
        },
        select: {
          versionNumber: true,
          status: true,
          publishedAt: true,
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

      console.log('');
      console.log(`=== MAX v${maxVersion} structure ===`);

      if (!maxVersionDetail) {
        console.log('(MAX version row not found)');
      } else {
        const moduleCount = maxVersionDetail.modules.length;
        const totalLessons = maxVersionDetail.modules.reduce(
          (sum, mod) => sum + mod.lessons.length,
          0,
        );

        console.log(`status:      ${maxVersionDetail.status}`);
        console.log(
          `publishedAt: ${maxVersionDetail.publishedAt?.toISOString() ?? 'null'}`,
        );
        console.log(`moduleCount: ${moduleCount}`);
        console.log(`lessonCount: ${totalLessons}`);
        console.log('modules:');
        for (const mod of maxVersionDetail.modules) {
          console.log(`  ${mod.slug} — ${mod.lessons.length} lessons`);
        }
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
