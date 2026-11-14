/**
 * READ-ONLY inspection: print course structure (latest version, modules, lessons)
 * for every course. Writes console output and packages/db/scripts/course-structure-report.txt.
 *
 * Run: pnpm --filter @calace/db exec tsx scripts/inspect-course-structure.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REPORT_FILE = join(__dirname, 'course-structure-report.txt');

function formatCourseBlock(
  title: string,
  slug: string,
  versionNumber: number | null,
  modules: Array<{
    title: string;
    slug: string;
    lessons: Array<{ title: string; slug: string }>;
  }>,
): string[] {
  const lines: string[] = [];
  lines.push(`   === ${title} (${slug}) ===`);

  if (versionNumber === null) {
    lines.push('   Version: (none)');
    lines.push('   TOTAL: 0 modules, 0 lessons');
    return lines;
  }

  lines.push(`   Version: ${versionNumber}`);

  let totalLessons = 0;

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const lessonCount = module.lessons.length;
    totalLessons += lessonCount;
    lines.push(
      `   Module ${i + 1}: ${module.title} (${module.slug}) — ${lessonCount} lessons`,
    );
    for (const lesson of module.lessons) {
      lines.push(`     - ${lesson.title} (${lesson.slug})`);
    }
  }

  lines.push(`   TOTAL: ${modules.length} modules, ${totalLessons} lessons`);
  return lines;
}

async function main(): Promise<void> {
  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
    orderBy: { title: 'asc' },
    select: {
      title: true,
      slug: true,
      versions: {
        where: { deletedAt: null },
        orderBy: { versionNumber: 'desc' },
        take: 1,
        select: {
          versionNumber: true,
          modules: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            select: {
              title: true,
              slug: true,
              lessons: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const outputLines: string[] = [];

  for (const course of courses) {
    const latestVersion = course.versions[0] ?? null;
    const block = formatCourseBlock(
      course.title,
      course.slug,
      latestVersion?.versionNumber ?? null,
      latestVersion?.modules ?? [],
    );
    outputLines.push(...block);
    outputLines.push('');
  }

  const report = outputLines.join('\n').replace(/\n$/, '');
  console.log(report);
  writeFileSync(REPORT_FILE, `${report}\n`, 'utf8');
  console.log(`\nReport written to ${REPORT_FILE}`);
}

main()
  .catch((error: unknown) => {
    console.error('Inspection failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
