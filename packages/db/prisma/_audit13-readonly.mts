/**
 * READ-ONLY audit Course 13 — delete after use.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, CourseVersionStatus } from '@prisma/client';

const COURSE_SLUG = 'cardiac-emergency';
const ASSET_DIR = join(
  import.meta.dirname,
  '../../../apps/web/public/assets/courses/cardiac-emergency',
);

function countSeedBlocks() {
  const seed = readFileSync(join(import.meta.dirname, 'seed-course-13-cardiac-emergencies.ts'), 'utf8');
  const headerEnd = seed.indexOf('const MODULES');
  const footerStart = seed.indexOf('function validatePackageSectionMapping');
  const body = footerStart > 0 ? seed.slice(headerEnd, footerStart) : seed;

  let images = 0;
  let videos = 0;
  let audios = 0;
  let audioWithUrl = 0;
  const imgRe = /type: 'image'/g;
  const vidRe = /type: 'video'/g;
  const audRe = /type: 'audio'/g;
  images = (body.match(imgRe) ?? []).length;
  videos = (body.match(vidRe) ?? []).length;
  audios = (body.match(audRe) ?? []).length;
  audioWithUrl = (body.match(/audioUrl:/g) ?? []).length;

  // Count blocks via buildContent blocks length - run seed's blockCounts if exported
  // Fallback: count unique block ids
  const ids = body.match(/id: 'cardiac-[^']+'/g) ?? [];
  const pendingAudioCount = (body.match(/pendingAudio\(/g) ?? []).length;
  const headingCount = (body.match(/type: 'heading'/g) ?? []).length;

  return {
    blockIds: ids.length,
    pendingAudioCount,
    headingCount,
    estimatedBlocks: ids.length + pendingAudioCount,
    images,
    videos,
    audios,
    audioWithUrl,
  };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const course = await prisma.course.findFirst({
      where: { slug: COURSE_SLUG, deletedAt: null },
      include: {
        versions: {
          where: { deletedAt: null },
          orderBy: { versionNumber: 'asc' },
          include: {
            modules: {
              where: { deletedAt: null },
              include: {
                lessons: {
                  where: { deletedAt: null },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      console.log('COURSE NOT FOUND');
      return;
    }

    console.log('=== VERSION MAP ===');
    for (const v of course.versions) {
      let blockCount = 0;
      let images = 0;
      let videos = 0;
      let audios = 0;
      let videoNull = 0;
      const extraBlocks: string[] = [];

      for (const m of v.modules) {
        for (const l of m.lessons) {
          const blocks = (l.content as { blocks?: Record<string, unknown>[] })?.blocks ?? [];
          blockCount += blocks.length;
          for (const b of blocks) {
            const tag = `${m.slug}/${l.slug}:${b.id} (${b.type})`;
            if (b.type === 'image') images++;
            if (b.type === 'video') {
              videos++;
              if (!b.videoUrl) videoNull++;
            }
            if (b.type === 'audio') {
              audios++;
              if (!b.audioUrl) extraBlocks.push(`${tag} audioUrl=null`);
              else extraBlocks.push(`${tag} audioUrl=${b.audioUrl}`);
            }
          }
        }
      }

      const certs = await prisma.certificate.findMany({
        where: { courseVersionId: v.id },
        select: { certificateNumber: true, issuedAt: true },
        orderBy: { issuedAt: 'asc' },
      });

      console.log(
        JSON.stringify({
          versionNumber: v.versionNumber,
          status: v.status,
          publishedAt: v.publishedAt?.toISOString() ?? null,
          label: v.label,
          lessonCount: v.modules.flatMap((m) => m.lessons).length,
          blockCount,
          images,
          videos,
          audios,
          videoUrlNull: videoNull,
          certCount: certs.length,
          certNumbers: certs.map((c) => c.certificateNumber),
        }),
      );

      if (v.versionNumber === 4 && extraBlocks.length) {
        console.log('  v4 audio detail:', extraBlocks.join('\n    '));
      }
    }

    const seedCounts = countSeedBlocks();
    console.log('\n=== SEED BLOCK COUNTS ===');
    console.log(JSON.stringify(seedCounts, null, 2));

    const v4 = course.versions.find((v) => v.versionNumber === 4);
    if (v4) {
      let dbBlocks = 0;
      for (const m of v4.modules) {
        for (const l of m.lessons) {
          dbBlocks += ((l.content as { blocks?: unknown[] })?.blocks ?? []).length;
        }
      }
      console.log('\n=== SEED vs DB v4 ===');
      console.log(`Seed estimated: ${seedCounts.estimatedBlocks}, DB v4: ${dbBlocks}, delta: ${dbBlocks - seedCounts.estimatedBlocks}`);
    }

    // Disk
    console.log('\n=== DISK FILES ===');
    const files = readdirSync(ASSET_DIR).sort();
    let capitalS = 0;
    for (const f of files) {
      const bytes = statSync(join(ASSET_DIR, f)).size;
      if (/^S\d/.test(f)) capitalS++;
      console.log(`${f}\t${bytes}`);
    }
    console.log(`capital-S filenames: ${capitalS}`);
    console.log(`hero-banner.jpg present: ${files.includes('hero-banner.jpg')}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
