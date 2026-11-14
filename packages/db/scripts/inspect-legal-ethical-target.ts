/**
 * READ-ONLY inspection: identify the live DB identity for the legal/ethical seed target
 * ("Legal & Ethical Issues in Nursing Practice") and surface the documentation course
 * that a rebuild will absorb ("CNA Renewal Readiness & CDPH Documentation").
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-legal-ethical-target.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const SEARCH_TERMS = [
  'legal',
  'ethic',
  'documentation',
  'renewal',
  'cdph',
  'readiness',
  'charting',
  'compliance',
] as const;

type CourseMatch = {
  id: string;
  slug: string;
  title: string;
  status: string;
  versions: {
    versionNumber: number;
    status: string;
    publishedAt: Date | null;
  }[];
};

function scoreBestMatch(course: Pick<CourseMatch, 'slug' | 'title'>): number {
  const slug = course.slug.toLowerCase();
  const title = course.title.toLowerCase();
  let score = 0;

  if (slug.includes('legal') || slug.includes('ethic')) score += 100;
  if (title.includes('legal') || title.includes('ethic')) score += 30;

  return score;
}

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
    '=== Matching courses (slug/title contains legal | ethic | documentation | renewal | cdph | readiness | charting | compliance) ===',
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

    console.log('');
  }

  const bestMatch = [...courses].sort(
    (a, b) => scoreBestMatch(b) - scoreBestMatch(a),
  )[0];

  const bestMaxVersion =
    bestMatch.versions.length > 0
      ? Math.max(...bestMatch.versions.map((v) => v.versionNumber))
      : null;

  console.log('=== Best match ===');
  console.log(`id:     ${bestMatch.id}`);
  console.log(`slug:   ${bestMatch.slug}`);
  console.log(`title:  ${bestMatch.title}`);
  console.log(`status: ${bestMatch.status}`);
  console.log(`score:  ${scoreBestMatch(bestMatch)}`);
  console.log('');

  if (bestMaxVersion === null) {
    console.log('=== MAX version structure (best match) ===');
    console.log('(no versions)');
    console.log('');
    console.log('=== NOTE ===');
    console.log(
      'Confirm with Dr. Cliff whether to retire/redirect the absorbed documentation course',
    );
    console.log(
      '("CNA Renewal Readiness & CDPH Documentation") — course ARCHIVED / version RETIRED; never delete.',
    );
    return;
  }

  const maxVersionDetail = await prisma.courseVersion.findFirst({
    where: {
      courseId: bestMatch.id,
      versionNumber: bestMaxVersion,
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

  console.log(`=== MAX v${bestMaxVersion} structure (best match) ===`);

  if (!maxVersionDetail) {
    console.log('(MAX version row not found)');
    console.log('');
    console.log('=== NOTE ===');
    console.log(
      'Confirm with Dr. Cliff whether to retire/redirect the absorbed documentation course',
    );
    console.log(
      '("CNA Renewal Readiness & CDPH Documentation") — course ARCHIVED / version RETIRED; never delete.',
    );
    return;
  }

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

  console.log('');
  console.log('=== NOTE ===');
  console.log(
    'Confirm with Dr. Cliff whether to retire/redirect the absorbed documentation course',
  );
  console.log(
    '("CNA Renewal Readiness & CDPH Documentation") — course ARCHIVED / version RETIRED; never delete.',
  );
}

main()
  .catch((error: unknown) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
