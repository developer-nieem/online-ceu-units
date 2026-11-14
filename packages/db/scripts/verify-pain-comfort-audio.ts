import { PrismaClient } from '@prisma/client';

const TENANT_SLUG = 'cal-ace';
const COURSE_SLUG = 'pain-comfort';
const TARGET_IDS = [
  'pain-s03-audio',
  'pain-s06-audio',
  'pain-s09-intro-audio',
  'pain-s11-audio',
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

    // Highest-numbered DRAFT = the version the CMS edits / the seed targets.
    const draft = [...course.versions]
      .filter((v) => v.status === 'DRAFT')
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!draft) throw new Error('No DRAFT version found.');
    console.log(`\nTarget DRAFT: v${draft.versionNumber} (id ${draft.id})\n`);

    const lessons = await prisma.lesson.findMany({
      where: { module: { courseVersionId: draft.id } },
      select: { slug: true, content: true },
    });

    const found: Record<string, { lesson: string; audioUrl: string | null }> = {};
    for (const lesson of lessons) {
      const doc = lesson.content as any;
      const blocks = doc?.blocks ?? [];
      for (const b of blocks) {
        if (TARGET_IDS.includes(b.id)) {
          found[b.id] = { lesson: lesson.slug, audioUrl: b.audioUrl ?? null };
        }
      }
    }

    let allOk = true;
    for (const id of TARGET_IDS) {
      const hit = found[id];
      if (!hit) {
        console.log(`MISSING BLOCK: ${id}`);
        allOk = false;
      } else {
        const ok = !!hit.audioUrl;
        if (!ok) allOk = false;
        console.log(`${ok ? 'OK  ' : 'NULL'} | ${hit.lesson} | ${id} | ${hit.audioUrl ?? 'NULL'}`);
      }
    }
    console.log(`\n${allOk ? 'PASS — all 4 audioUrls present' : 'FAIL — one or more missing'}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
