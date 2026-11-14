import {
  archiveCourse,
  createCourse,
  getCourseById,
  getCourseBySlug,
  getPublishedCourseBySlug,
  listCourses,
  listPublishedCourses,
  setCourseStatus,
  updateCourse,
} from './db/repository';
import { listEnrollmentsForUser } from '../enrollment/repository';
import type { LearnerEnrollmentRecord } from '../enrollment/types';
import type { CmsCourse, CmsCourseListFilters, LearnerCourseView } from './types';

export {
  archiveCourse,
  createCourse,
  getCourseById,
  getCourseBySlug,
  getPublishedCourseBySlug,
  listCourses,
  listPublishedCourses,
  setCourseStatus,
  updateCourse,
};

export { CMS_CATEGORIES } from './mock-catalog';
export { CMS_SEED_COURSES } from '@calace/db/cms-seed-data';
export type {
  CmsAiMetadata,
  CmsCourse,
  CmsCourseInput,
  CmsCourseListFilters,
  CmsCoursePricing,
  CmsLesson,
  CmsLessonBlock,
  CmsPublishStatus,
  LearnerCourseView,
  LearnerEnrollmentStatus,
} from './types';
export { DEFAULT_COURSE_PRICING } from './types';

function formatCompletedOn(completedAt?: string): string | undefined {
  if (!completedAt) return undefined;
  return completedAt.slice(0, 10);
}

function applyEnrollmentToCourse(
  course: CmsCourse,
  enrollment?: LearnerEnrollmentRecord,
): LearnerCourseView {
  if (!enrollment || enrollment.status === 'not_enrolled') {
    return { ...course, enrollmentStatus: 'not_enrolled' };
  }

  return {
    ...course,
    enrollmentId: enrollment.id,
    enrollmentStatus: enrollment.status,
    progressPercent: enrollment.progressPercent,
    completedOn: formatCompletedOn(enrollment.completedAt),
    enrolledAt: enrollment.enrolledAt,
  };
}

async function getEnrollmentMapForUser(userId: string): Promise<Map<string, LearnerEnrollmentRecord>> {
  const enrollments = await listEnrollmentsForUser(userId);
  const map = new Map<string, LearnerEnrollmentRecord>();

  for (const enrollment of enrollments) {
    map.set(enrollment.courseSlug, enrollment);
  }

  return map;
}

export async function listLearnerCatalog(
  userId?: string | null,
  filters: Omit<CmsCourseListFilters, 'status'> = {},
): Promise<LearnerCourseView[]> {
  const courses = await listPublishedCourses(filters);
  const enrollmentMap = userId ? await getEnrollmentMapForUser(userId) : new Map();

  return courses.map((course) =>
    applyEnrollmentToCourse(course, enrollmentMap.get(course.slug)),
  );
}

export async function getLearnerCourseBySlug(
  slug: string,
  userId?: string | null,
): Promise<LearnerCourseView | undefined> {
  const course = await getPublishedCourseBySlug(slug);
  if (!course) {
    return undefined;
  }

  if (!userId) {
    return applyEnrollmentToCourse(course);
  }

  const enrollmentMap = await getEnrollmentMapForUser(userId);
  return applyEnrollmentToCourse(course, enrollmentMap.get(slug));
}

export async function listLearnerActiveCourses(userId: string): Promise<LearnerCourseView[]> {
  const courses = await listLearnerCatalog(userId);
  return courses.filter((course) => course.enrollmentStatus === 'active');
}

export async function listLearnerCompletedCourses(userId: string): Promise<LearnerCourseView[]> {
  const courses = await listLearnerCatalog(userId);
  return courses.filter((course) => course.enrollmentStatus === 'completed');
}

export async function searchAdminCourses(query: string): Promise<CmsCourse[]> {
  return listCourses({ query, status: 'all' });
}
