/**
 * READ-ONLY inspection: identify the live DB identity for Course-11 pain/comfort seed target
 * ("Pain Recognition & Comfort Care").
 *
 * CONVERSION — a new topic is taking over the old Course 11 slot. We must SEE what
 * currently lives at candidate slugs before deciding how to seed.
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-pain-comfort-target.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'cal-ace';
const SEARCH_TERMS = [
  'pain',
  'comfort',
  'palliat',
  'end-of-life',
  'hospice',
  'symptom',
  'distress',
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
      createdAt: true,
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
    '=== Matching courses (slug/title contains pain | comfort | palliat | end-of-life | hospice | symptom | distress) ===',
  );
  console.log(`count: ${courses.length}`);
  console.log('');

  if (courses.length === 0) {
    console.log('=== Candidate repurpose targets ===');
    console.log('No existing "pain" course found by slug/title.');
    console.log('No existing "comfort" course found by slug/title.');
    console.log(
      'Neither "pain" nor "comfort" course exists — the old Course 11 likely lives under a DIFFERENT slug/title not caught here.',
    );
    console.log('');
    console.log('=== NOTE — CONVERSION DECISION (Dr. Cliff) ===');
    console.log(
      'This is a CONVERSION: a new topic (Pain Recognition & Comfort Care) replacing the old Course 11.',
    );
    console.log(
      'Decide: (a) repurpose an existing slug with a NEW VERSION (title + content change), or',
    );
    console.log(
      '        (b) retire the old slug (course ARCHIVED / version RETIRED — never delete) and seed FRESH.',
    );
    console.log('This inspect modifies nothing.');
    console.log('');
  } else {
    for (const course of courses) {
      const maxVersion =
        course.versions.length > 0
          ? Math.max(...course.versions.map((v) => v.versionNumber))
          : null;

      console.log('--- Course ---');
      console.log(`id:        ${course.id}`);
      console.log(`slug:      ${course.slug}`);
      console.log(`title:     ${course.title}`);
      console.log(`status:    ${course.status}`);
      console.log(`createdAt: ${course.createdAt.toISOString()}`);

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

    const painMatch = courses.find(
      (c) =>
        c.slug.toLowerCase().includes('pain') ||
        c.title.toLowerCase().includes('pain'),
    );
    const comfortMatch = courses.find(
      (c) =>
        c.slug.toLowerCase().includes('comfort') ||
        c.title.toLowerCase().includes('comfort'),
    );

    console.log('=== Candidate repurpose targets ===');
    if (painMatch) {
      console.log(
        `Found a "pain" course already: slug=${painMatch.slug}, title="${painMatch.title}" — candidate repurpose target.`,
      );
    } else {
      console.log('No existing "pain" course found by slug/title.');
    }
    if (comfortMatch && comfortMatch.id !== painMatch?.id) {
      console.log(
        `Found a "comfort" course already: slug=${comfortMatch.slug}, title="${comfortMatch.title}" — candidate repurpose target.`,
      );
    } else if (!comfortMatch) {
      console.log('No existing "comfort" course found by slug/title.');
    }
    if (!painMatch && !comfortMatch) {
      console.log(
        'Neither "pain" nor "comfort" course exists — the old Course 11 likely lives under a DIFFERENT slug/title not caught here.',
      );
    }
    console.log('');

    console.log('=== NOTE — CONVERSION DECISION (Dr. Cliff) ===');
    console.log(
      'This is a CONVERSION: a new topic (Pain Recognition & Comfort Care) replacing the old Course 11.',
    );
    console.log(
      'Decide: (a) repurpose an existing slug with a NEW VERSION (title + content change), or',
    );
    console.log(
      '        (b) retire the old slug (course ARCHIVED / version RETIRED — never delete) and seed FRESH.',
    );
    console.log('This inspect modifies nothing.');
    console.log('');
  }

  const allCourses = await prisma.course.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      slug: true,
      title: true,
      status: true,
      createdAt: true,
      versions: {
        where: { deletedAt: null },
        select: { versionNumber: true },
      },
    },
  });

  console.log('=== Full course roster (tenant cal-ace, createdAt ascending) ===');
  console.log(`count: ${allCourses.length}`);
  console.log('');

  allCourses.forEach((course, index) => {
    const maxVersion =
      course.versions.length > 0
        ? Math.max(...course.versions.map((v) => v.versionNumber))
        : null;
    const slot = index + 1;

    console.log(`--- #${slot} ---`);
    console.log(`slug:              ${course.slug}`);
    console.log(`title:             ${course.title}`);
    console.log(`status:            ${course.status}`);
    console.log(`MAX versionNumber: ${maxVersion ?? '(none)'}`);
    console.log(`createdAt:         ${course.createdAt.toISOString()}`);
    console.log('');
  });
}

main()
  .catch((error: unknown) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
