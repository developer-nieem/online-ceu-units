import type { CatalogCourse } from './catalog';

/** Display order for the freemium section (Communication → COPD → Diabetes). */
export const FREEMIUM_COURSE_SLUG_ORDER = [
  'communication-skills',
  'respiratory-care-copd-asthma',
  'diabetes-care-hypoglycemia-hyperglycemia',
] as const;

export function sortFreemiumCourses(courses: CatalogCourse[]): CatalogCourse[] {
  const orderIndex = new Map(FREEMIUM_COURSE_SLUG_ORDER.map((slug, i) => [slug, i]));

  return [...courses].sort((a, b) => {
    const aIdx = orderIndex.get(a.slug as (typeof FREEMIUM_COURSE_SLUG_ORDER)[number]) ?? 99;
    const bIdx = orderIndex.get(b.slug as (typeof FREEMIUM_COURSE_SLUG_ORDER)[number]) ?? 99;
    return aIdx - bIdx;
  });
}

export function partitionCatalogCourses(courses: CatalogCourse[]) {
  const freeCourses = sortFreemiumCourses(courses.filter((c) => c.isFree));
  const paidCourses = courses.filter((c) => !c.isFree);
  return { freeCourses, paidCourses };
}
