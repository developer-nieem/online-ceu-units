/**
 * READ-ONLY inspection: communication-skills course v4 DRAFT vs v3 PUBLISHED structure.
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-comms-v4.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_ID = 'cmq4ozxvm004vsrg09b4n33as';
const TENANT_SLUG = 'cal-ace';

function truncate(value: unknown, maxLen = 200): string {
  const text =
    typeof value === 'string'
      ? value
      : value === null || value === undefined
        ? ''
        : JSON.stringify(value);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

function pickContentMetaOverview(contentMeta: unknown): Record<string, string> {
  if (!contentMeta || typeof contentMeta !== 'object' || Array.isArray(contentMeta)) {
    return {};
  }
  const meta = contentMeta as Record<string, unknown>;
  const result: Record<string, string> = {};
  if ('title' in meta) result.title = truncate(meta.title);
  if ('overview' in meta) result.overview = truncate(meta.overview);
  return result;
}

async function inspectVersion(versionNumber: number) {
  const version = await prisma.courseVersion.findFirst({
    where: {
      courseId: COURSE_ID,
      versionNumber,
      deletedAt: null,
    },
    select: {
      id: true,
      label: true,
      status: true,
      deliveryMode: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      contentMeta: true,
      modules: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          slug: true,
          title: true,
          sortOrder: true,
          status: true,
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            select: {
              slug: true,
              title: true,
              sortOrder: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return version;
}

async function main(): Promise<void> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: TENANT_SLUG, deletedAt: null },
    select: { id: true, slug: true },
  });

  console.log('=== Context ===');
  console.log(`tenant: ${tenant ? `${tenant.slug} (${tenant.id})` : `NOT FOUND (${TENANT_SLUG})`}`);
  console.log(`courseId: ${COURSE_ID}`);
  console.log('');

  const course = await prisma.course.findFirst({
    where: { id: COURSE_ID, deletedAt: null },
    select: { id: true, slug: true, title: true, tenantId: true },
  });

  if (!course) {
    console.log('Course not found.');
    return;
  }

  console.log(`course: ${course.title} (${course.slug})`);
  console.log('');

  for (const versionNumber of [4, 3] as const) {
    const version = await inspectVersion(versionNumber);

    console.log(`=== CourseVersion v${versionNumber} ===`);

    if (!version) {
      console.log('(not found)');
      console.log('');
      continue;
    }

    const contentMetaSummary = pickContentMetaOverview(version.contentMeta);

    console.log(`id:           ${version.id}`);
    console.log(`label:        ${version.label ?? 'null'}`);
    console.log(`status:       ${version.status}`);
    console.log(`deliveryMode: ${version.deliveryMode}`);
    console.log(`publishedAt:  ${version.publishedAt?.toISOString() ?? 'null'}`);
    console.log(`createdAt:    ${version.createdAt.toISOString()}`);
    console.log(`updatedAt:    ${version.updatedAt.toISOString()}`);
    console.log(`contentMeta:  ${JSON.stringify(contentMetaSummary)}`);
    console.log('');

    const moduleCount = version.modules.length;
    let totalLessons = 0;

    console.log(`modules (${moduleCount}):`);

    for (const mod of version.modules) {
      const lessonCount = mod.lessons.length;
      totalLessons += lessonCount;
      console.log(
        `  [${mod.sortOrder}] ${mod.slug} | ${mod.title} | status=${mod.status} | lessons=${lessonCount}`,
      );
      for (const lesson of mod.lessons) {
        console.log(
          `    [${lesson.sortOrder}] ${lesson.slug} | ${lesson.title} | status=${lesson.status}`,
        );
      }
    }

    console.log('');
    console.log(`TOTAL: ${moduleCount} modules, ${totalLessons} lessons`);
    console.log('');
  }
}

main()
  .catch((error: unknown) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
