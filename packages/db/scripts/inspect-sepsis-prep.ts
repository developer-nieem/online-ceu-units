/**
 * READ-ONLY inspection: prep facts for creating sepsis course & retiring infection-control-prevention.
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-sepsis-prep.ts
 */
import {
  CourseStatus,
  CourseVersionStatus,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const SEPSIS_SLUG = 'sepsis-recognition';
const RETIRE_SLUG = 'infection-control-prevention';
const TEMPLATE_SLUG_CANDIDATES = [
  'infection-control',
  'hypertension',
  'malnutrition-elderly',
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

  // -------------------------------------------------------------------------
  // 1. CONFIRM SLUG IS FREE
  // -------------------------------------------------------------------------
  console.log('=== 1. Sepsis slug / title search ===');

  const sepsisMatches = await prisma.course.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
      OR: [
        { slug: SEPSIS_SLUG },
        { title: { contains: 'sepsis', mode: 'insensitive' } },
      ],
    },
    orderBy: { title: 'asc' },
    select: { id: true, slug: true, title: true, status: true },
  });

  if (sepsisMatches.length === 0) {
    console.log('none — slug free');
  } else {
    console.log(`count: ${sepsisMatches.length}`);
    for (const course of sepsisMatches) {
      console.log(
        `  id=${course.id} | slug=${course.slug} | title=${course.title} | status=${course.status}`,
      );
    }
  }
  console.log('');

  // -------------------------------------------------------------------------
  // 2. OLD COURSE TO RETIRE
  // -------------------------------------------------------------------------
  console.log(`=== 2. Course to retire: "${RETIRE_SLUG}" ===`);

  const retireCourse = await prisma.course.findFirst({
    where: {
      tenantId: tenant.id,
      slug: RETIRE_SLUG,
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      versions: {
        where: { deletedAt: null },
        orderBy: { versionNumber: 'asc' },
        select: { versionNumber: true, status: true },
      },
    },
  });

  if (!retireCourse) {
    console.log(`NOT FOUND: slug="${RETIRE_SLUG}"`);
  } else {
    console.log(`id:     ${retireCourse.id}`);
    console.log(`slug:   ${retireCourse.slug}`);
    console.log(`title:  ${retireCourse.title}`);
    console.log(`status: ${retireCourse.status}`);

    const enrollmentCount = await prisma.enrollment.count({
      where: {
        deletedAt: null,
        courseVersion: { courseId: retireCourse.id, deletedAt: null },
      },
    });

    const certificateCount = await prisma.certificate.count({
      where: {
        completion: {
          courseVersion: { courseId: retireCourse.id, deletedAt: null },
        },
      },
    });

    console.log(
      `enrollmentCount: ${enrollmentCount} (Enrollment rows via CourseVersion.courseId)`,
    );
    console.log(
      `certificateCount: ${certificateCount} (Certificate rows via Completion → CourseVersion.courseId)`,
    );

    if (retireCourse.versions.length === 0) {
      console.log('versions: (none)');
    } else {
      console.log('versions:');
      for (const version of retireCourse.versions) {
        console.log(
          `  v${version.versionNumber} | status=${version.status}`,
        );
      }
    }
  }
  console.log('');

  // -------------------------------------------------------------------------
  // 3. TEMPLATE FOR NEW COURSE
  // -------------------------------------------------------------------------
  console.log('=== 3. Template course (3-module / 12-lesson scaffold) ===');

  let templateSlug: string | null = null;

  for (const slug of TEMPLATE_SLUG_CANDIDATES) {
    const candidate = await prisma.course.findFirst({
      where: { tenantId: tenant.id, slug, deletedAt: null },
      select: {
        id: true,
        versions: {
          where: { deletedAt: null },
          orderBy: { versionNumber: 'desc' },
          take: 1,
          select: {
            modules: {
              where: { deletedAt: null },
              select: {
                lessons: { where: { deletedAt: null }, select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!candidate || candidate.versions.length === 0) continue;

    const modules = candidate.versions[0]!.modules;
    const moduleCount = modules.length;
    const lessonCount = modules.reduce((sum, m) => sum + m.lessons.length, 0);

    if (moduleCount === 3 && lessonCount === 12) {
      templateSlug = slug;
      break;
    }
  }

  if (!templateSlug) {
    console.log(
      `No template found among [${TEMPLATE_SLUG_CANDIDATES.join(', ')}] with exactly 3 modules / 12 lessons.`,
    );
  } else {
    console.log(`selected template slug: ${templateSlug}`);
    console.log('');

    const template = await prisma.course.findFirst({
      where: {
        tenantId: tenant.id,
        slug: templateSlug,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        ceHours: true,
        catalogData: true,
        categoryId: true,
        professionId: true,
        category: { select: { id: true, slug: true, name: true } },
        profession: { select: { id: true, code: true, name: true } },
      },
    });

    if (!template) {
      console.log(`Template course row missing for slug="${templateSlug}"`);
    } else {
      console.log('--- Course shape to replicate ---');
      console.log(`id:           ${template.id}`);
      console.log(`slug:         ${template.slug}`);
      console.log(`title:        ${template.title}`);
      console.log(`status:       ${template.status}`);
      console.log(`ceHours:      ${template.ceHours.toString()}`);
      console.log(
        `categoryId:   ${template.categoryId ?? 'null'} (slug: ${template.category?.slug ?? 'null'}, name: ${template.category?.name ?? 'null'})`,
      );
      console.log(
        `professionId: ${template.professionId ?? 'null'} (code: ${template.profession?.code ?? 'null'}, name: ${template.profession?.name ?? 'null'})`,
      );
      console.log('catalogData:');
      console.log(JSON.stringify(template.catalogData, null, 2));
    }
  }
  console.log('');

  // -------------------------------------------------------------------------
  // 4. ENUM VALUES
  // -------------------------------------------------------------------------
  console.log('=== 4. CourseStatus enum values ===');
  console.log(Object.values(CourseStatus).join(', '));
  console.log('');
  console.log('=== CourseVersionStatus enum values ===');
  console.log(Object.values(CourseVersionStatus).join(', '));
}

main()
  .catch((error: unknown) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
