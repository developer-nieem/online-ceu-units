/**
 * Bulk AI-generate full 1-hour CNA CEU courses from seeded topic list.
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-ai-bulk-courses
 *   pnpm --filter @calace/db db:seed-ai-bulk-courses -- --dry-run
 *   pnpm --filter @calace/db db:seed-ai-bulk-courses -- --replace-scaffold
 *
 * Prerequisites:
 *   pnpm --filter @calace/ai-course-generation build
 *   pnpm db:seed && pnpm db:seed-professional-development-courses  (optional scaffold)
 */
import { PrismaClient } from '@prisma/client';

import { bulkGenerateAiCourses } from '../src/ai-bulk-generate';
import { PROFESSIONAL_DEVELOPMENT_BULK_COURSES } from '../src/professional-development-bulk-courses';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const replaceScaffold = args.includes('--replace-scaffold');

  const prisma = new PrismaClient();
  const entries = PROFESSIONAL_DEVELOPMENT_BULK_COURSES.map((c) => ({
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    californiaRelevance: c.californiaRelevance,
    toneFocus: c.toneFocus,
    courseCode: c.courseCode,
  }));

  console.log(
    `AI bulk generation: ${entries.length} courses · dryRun=${dryRun} · replaceScaffold=${replaceScaffold}`,
  );

  try {
    const result = await bulkGenerateAiCourses(prisma, entries, {
      dryRun,
      replaceScaffoldOnly: replaceScaffold,
      skipExistingAiStructure: !replaceScaffold,
    });

    console.log('Complete.');
    console.log(`  Generated: ${result.generated}`);
    console.log(`  Skipped:   ${result.skipped}`);
    if (result.errors.length) {
      console.log(`  Errors:    ${result.errors.length}`);
      for (const e of result.errors) {
        console.error(`    ${e.slug}: ${e.message}`);
      }
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Bulk AI generation failed:', error);
  process.exit(1);
});
