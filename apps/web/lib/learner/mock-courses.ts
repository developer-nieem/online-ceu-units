/**
 * @deprecated Import from `@/lib/cms/catalog` instead.
 */
import { getLearnerCourseBySlug, listLearnerCatalog } from '@/lib/cms/catalog';

function toLegacyCourse(course: Awaited<ReturnType<typeof listLearnerCatalog>>[number]) {
  return {
    slug: course.slug,
    title: course.title,
    ceUnits: course.ceUnits,
    delivery: course.deliveryMethod,
    status:
      course.enrollmentStatus === 'completed'
        ? ('completed' as const)
        : course.enrollmentStatus === 'active'
          ? ('active' as const)
          : ('not_enrolled' as const),
    completedOn: course.completedOn,
    progress: course.progressPercent,
  };
}

/** @deprecated Use listLearnerCatalog() from `@/lib/cms/catalog`. */
export async function getMockCourses() {
  return (await listLearnerCatalog()).map(toLegacyCourse);
}

/** @deprecated Use getLearnerCourseBySlug() from `@/lib/cms/catalog`. */
export async function getCourseBySlug(slug: string) {
  const course = await getLearnerCourseBySlug(slug);
  return course ? toLegacyCourse(course) : undefined;
}
