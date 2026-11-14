import { PrismaClient } from '@prisma/client';

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'mobility-safety';
const WIRED_IDS = [
  'fall-s01-video',
  'fall-s04-video',
  'fall-s10-video',
  'fall-s12-video',
];
const SHOULD_BE_NULL_IDS = [
  'fall-s02-video',
  'fall-s03-video',
  'fall-s05-video',
  'fall-s06-video',
  'fall-s07-video',
  'fall-s08-video',
];

async function main() {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: TENANT_SLUG, deletedAt: null },
      select: { id: true },
    });
    if (!tenant) throw new Error(`Tenant "${TENANT_SLUG}" not found.`);

    const course = await prisma.course.findFirst({
      where: { tenantId: tenant.id, slug: COURSE_SLUG, deletedAt: null },
      select: {
        id: true,
        slug: true,
        status: true,
        versions: {
          select: { id: true, versionNumber: true, status: true, publishedAt: true },
          orderBy: { versionNumber: 'asc' },
        },
      },
    });
    if (!course) throw new Error(`Course "${COURSE_SLUG}" not found.`);

    console.log(`course.status: ${course.status}`);
    console.log('versions:');
    for (const v of course.versions) {
      console.log(
        `  v${v.versionNumber} | status=${v.status} | publishedAt=${v.publishedAt?.toISOString() ?? 'null'}`,
      );
    }

    const published = course.versions.filter((v) => v.status === 'PUBLISHED');
    if (published.length) {
      console.log(
        `\n[CERT-SAFETY] PUBLISHED version(s) present: ${published
          .map((v) => `v${v.versionNumber}`)
          .join(', ')} — these should be UNCHANGED by the re-seed.`,
      );
    } else {
      console.log('\n[CERT-SAFETY] No PUBLISHED version — nothing live to disturb.');
    }

    const draft = [...course.versions]
      .filter((v) => v.status === 'DRAFT')
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!draft) throw new Error('No DRAFT version found.');
    console.log(`\nTarget DRAFT: v${draft.versionNumber} (id ${draft.id})\n`);

    const lessons = await prisma.lesson.findMany({
      where: { module: { courseVersionId: draft.id } },
      select: { slug: true, content: true },
    });

    const videoBlocks: Record<string, { lesson: string; videoUrl: string | null }> = {};
    for (const lesson of lessons) {
      const doc = lesson.content as any;
      const blocks = doc?.blocks ?? [];
      for (const b of blocks) {
        if (b.type === 'video') {
          videoBlocks[b.id] = { lesson: lesson.slug, videoUrl: b.videoUrl ?? null };
        }
      }
    }

    console.log('WIRED (expect non-null):');
    let allWiredOk = true;
    for (const id of WIRED_IDS) {
      const hit = videoBlocks[id];
      if (!hit) {
        console.log(`  MISSING BLOCK: ${id}`);
        allWiredOk = false;
      } else {
        const ok = !!hit.videoUrl;
        if (!ok) allWiredOk = false;
        console.log(`  ${ok ? 'OK  ' : 'NULL'} | ${hit.lesson} | ${id} | ${hit.videoUrl ?? 'NULL'}`);
      }
    }

    console.log('\nUNWIRED (expect null):');
    let allNullOk = true;
    for (const id of SHOULD_BE_NULL_IDS) {
      const hit = videoBlocks[id];
      if (!hit) {
        console.log(`  (block ${id} not found — ok if it doesn't exist)`);
      } else {
        const isNull = !hit.videoUrl;
        if (!isNull) allNullOk = false;
        console.log(`  ${isNull ? 'null' : 'UNEXPECTED'} | ${hit.lesson} | ${id} | ${hit.videoUrl ?? 'null'}`);
      }
    }

    console.log(
      `\n${allWiredOk && allNullOk ? 'PASS — 4 wired non-null, others null' : 'FAIL — check above'}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
