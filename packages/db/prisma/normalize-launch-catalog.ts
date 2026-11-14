/**
 * Normalize launch CNA CEU catalog in the database and retire duplicate/legacy courses.
 * Run via seed or: pnpm --filter @calace/db db:normalize-launch-catalog
 */
import { CourseStatus, Prisma, PrismaClient } from '@prisma/client';

import { DEFAULT_LAUNCH_CEU_HOURS } from '../src/ceu-defaults';
import {
  ARCHIVED_LEGACY_COURSE_SLUGS,
  CANONICAL_LAUNCH_COURSE_SLUGS,
  LAUNCH_CATALOG_DURATION_MINUTES,
  LAUNCH_DISPLAY_DURATION,
  mergeLaunchCatalogData,
} from '../src/launch-catalog';

const TENANT_SLUG = 'cal-ace';

export async function normalizeLaunchCatalog(
  prisma: PrismaClient,
  tenantSlug = TENANT_SLUG,
): Promise<{
  coursesNormalized: number;
  versionsNormalized: number;
  coursesArchived: number;
}> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, deletedAt: null },
  });
  if (!tenant) {
    console.warn(`  normalize-launch-catalog: tenant ${tenantSlug} not found, skipping`);
    return { coursesNormalized: 0, versionsNormalized: 0, coursesArchived: 0 };
  }

  let coursesNormalized = 0;
  let versionsNormalized = 0;
  let coursesArchived = 0;
  const now = new Date();

  for (const slug of ARCHIVED_LEGACY_COURSE_SLUGS) {
    const archived = await prisma.course.updateMany({
      where: {
        tenantId: tenant.id,
        slug,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
        status: CourseStatus.ARCHIVED,
      },
    });
    if (archived.count > 0) {
      coursesArchived += archived.count;
      console.log(`  Archived legacy course slug: ${slug}`);
    }
  }

  for (const slug of CANONICAL_LAUNCH_COURSE_SLUGS) {
    const course = await prisma.course.findFirst({
      where: { tenantId: tenant.id, slug, deletedAt: null },
      include: {
        versions: { where: { deletedAt: null }, orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!course) continue;

    const existingCatalog = (course.catalogData ?? {}) as Record<string, unknown>;
    const catalogData = mergeLaunchCatalogData(existingCatalog, DEFAULT_LAUNCH_CEU_HOURS);

    if (
      Number(course.ceHours) !== DEFAULT_LAUNCH_CEU_HOURS ||
      (existingCatalog.durationMinutes as number | undefined) !== LAUNCH_CATALOG_DURATION_MINUTES ||
      existingCatalog.displayDuration !== LAUNCH_DISPLAY_DURATION
    ) {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          ceHours: DEFAULT_LAUNCH_CEU_HOURS,
          catalogData: catalogData as Prisma.InputJsonValue,
          status: CourseStatus.PUBLISHED,
        },
      });
      coursesNormalized += 1;
      console.log(`  Normalized course ${slug}: 1 CE hour, ${LAUNCH_DISPLAY_DURATION}`);
    }

    for (const version of course.versions) {
      if (Number(version.ceHours) === DEFAULT_LAUNCH_CEU_HOURS) continue;
      await prisma.courseVersion.update({
        where: { id: version.id },
        data: { ceHours: DEFAULT_LAUNCH_CEU_HOURS },
      });
      versionsNormalized += 1;
    }
  }

  return { coursesNormalized, versionsNormalized, coursesArchived };
}

async function main() {
  const prisma = new PrismaClient();
  console.log('Normalizing launch CNA CEU catalog…');
  try {
    const result = await normalizeLaunchCatalog(prisma);
    console.log('Normalize complete:', result);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
