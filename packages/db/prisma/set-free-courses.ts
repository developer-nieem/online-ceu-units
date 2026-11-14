/**
 * Mark the three freemium courses as free: Communication Skills, COPD, and Diabetes.
 * Run: pnpm --filter @calace/db db:set-free-courses
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Preferred slugs from launch / PD catalog seeds. */
const PREFERRED_SLUGS = [
  'communication-skills',
  'respiratory-care-copd-asthma',
  'diabetes-care-hypoglycemia-hyperglycemia',
] as const;

/** Fallback slug/title matchers when preferred slug is missing. */
const FALLBACK_MATCHERS: Array<{ label: string; test: (slug: string, title: string) => boolean }> =
  [
    {
      label: 'Communication Skills',
      test: (slug, title) => /communication/i.test(slug) || /communication/i.test(title),
    },
    {
      label: 'COPD',
      test: (slug, title) => /copd/i.test(slug) || /copd/i.test(title),
    },
    {
      label: 'Diabetes',
      test: (slug, title) =>
        (/diabetes/i.test(slug) || /diabetes/i.test(title)) &&
        !/diabetic-foot/i.test(slug),
    },
  ];

type CatalogDataRecord = Record<string, unknown>;

function mergeFreeCatalogData(existing: CatalogDataRecord): CatalogDataRecord {
  const tags = Array.isArray(existing.tags)
    ? [...new Set([...(existing.tags as string[]), 'Free', 'Featured'])]
    : ['Free', 'Featured'];

  const existingPricing =
    existing.pricing && typeof existing.pricing === 'object'
      ? (existing.pricing as Record<string, unknown>)
      : {};

  return {
    ...existing,
    price: 0,
    featured: true,
    tags,
    pricing: {
      priceCents: 0,
      salePriceCents: null,
      pricingActive: true,
      isFree: true,
      ...existingPricing,
      priceCents: 0,
      salePriceCents: null,
      pricingActive: true,
      isFree: true,
    },
  };
}

async function resolveFreemiumCourses() {
  const allCourses = await prisma.course.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, title: true, catalogData: true },
    orderBy: { slug: 'asc' },
  });

  const resolved: typeof allCourses = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < PREFERRED_SLUGS.length; i++) {
    const preferredSlug = PREFERRED_SLUGS[i];
    const fallback = FALLBACK_MATCHERS[i];

    const bySlug = allCourses.find((c) => c.slug === preferredSlug && !usedIds.has(c.id));
    if (bySlug) {
      resolved.push(bySlug);
      usedIds.add(bySlug.id);
      continue;
    }

    const byPattern = allCourses.find(
      (c) => !usedIds.has(c.id) && fallback.test(c.slug, c.title),
    );
    if (byPattern) {
      resolved.push(byPattern);
      usedIds.add(byPattern.id);
    } else {
      console.warn(`  ⚠ No course found for ${fallback.label}`);
    }
  }

  return resolved;
}

export async function setFreeCourses(): Promise<{ updated: string[] }> {
  const courses = await resolveFreemiumCourses();
  const updated: string[] = [];

  for (const course of courses) {
    const existing = (course.catalogData ?? {}) as CatalogDataRecord;
    const nextCatalogData = mergeFreeCatalogData(existing);

    await prisma.course.update({
      where: { id: course.id },
      data: { catalogData: nextCatalogData },
    });

    updated.push(course.slug);
    console.log(`  ✓ ${course.slug} — "${course.title}" set to free`);
  }

  return { updated };
}

async function main() {
  console.log('Setting freemium courses (Communication, COPD, Diabetes)…');
  const result = await setFreeCourses();
  console.log(`Done. Updated ${result.updated.length} course(s):`, result.updated);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
