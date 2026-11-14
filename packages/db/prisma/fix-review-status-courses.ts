/**
 * One-time data correction: restore Course.status to PUBLISHED for courses
 * stranded in REVIEW by createDraftRevision demoting a live catalog course.
 * Run via: pnpm --filter @calace/db db:fix-review-status-courses
 */
import { CourseStatus, CourseVersionStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function fixReviewStatusCourses(): Promise<{ corrected: number }> {
  const affected = await prisma.course.findMany({
    where: {
      status: CourseStatus.REVIEW,
      deletedAt: null,
      versions: {
        some: {
          status: CourseVersionStatus.PUBLISHED,
          deletedAt: null,
        },
      },
    },
    select: { id: true, slug: true },
  });

  for (const course of affected) {
    await prisma.course.update({
      where: { id: course.id },
      data: { status: CourseStatus.PUBLISHED },
    });
    console.log(`  Restored ${course.slug} (${course.id}) → PUBLISHED`);
  }

  return { corrected: affected.length };
}

async function main() {
  console.log('Fixing courses stranded in REVIEW with a published version…');
  const { corrected } = await fixReviewStatusCourses();
  console.log(`Done. Corrected ${corrected} course(s).`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
