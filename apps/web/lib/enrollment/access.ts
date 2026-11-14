import { getCourseById, getPublishedCourseBySlug } from '@/lib/cms/db/repository';

import {
  enrollmentAllowsCourseAccess,
  getEnrollmentForUserCourse,
  getEnrollmentForUserCourseSlug,
} from './repository';
import type { LearnerEnrollmentRecord } from './types';

export interface CourseAccessResult {
  allowed: boolean;
  reason: 'not_authenticated' | 'not_enrolled' | 'enrollment_inactive' | 'course_unavailable' | 'allowed';
  course?: Awaited<ReturnType<typeof getCourseById>>;
  enrollment?: LearnerEnrollmentRecord;
}

export async function checkCourseAccessById(
  userId: string | null,
  courseId: string,
): Promise<CourseAccessResult> {
  const course = await getCourseById(courseId);

  if (!course || course.status !== 'published' || !course.active) {
    return { allowed: false, reason: 'course_unavailable', course: course ?? undefined };
  }

  if (!userId) {
    return { allowed: false, reason: 'not_authenticated', course };
  }

  const enrollment = await getEnrollmentForUserCourse(userId, courseId);
  if (!enrollment) {
    return { allowed: false, reason: 'not_enrolled', course };
  }

  if (!enrollmentAllowsCourseAccess(enrollment.status)) {
    return { allowed: false, reason: 'enrollment_inactive', course, enrollment };
  }

  return { allowed: true, reason: 'allowed', course, enrollment };
}

export async function checkCourseAccessBySlug(
  userId: string | null,
  courseSlug: string,
): Promise<CourseAccessResult> {
  const course = await getPublishedCourseBySlug(courseSlug);

  if (!course) {
    return { allowed: false, reason: 'course_unavailable' };
  }

  if (!userId) {
    return { allowed: false, reason: 'not_authenticated', course };
  }

  const enrollment = await getEnrollmentForUserCourseSlug(userId, courseSlug);
  if (!enrollment) {
    return { allowed: false, reason: 'not_enrolled', course };
  }

  if (!enrollmentAllowsCourseAccess(enrollment.status)) {
    return { allowed: false, reason: 'enrollment_inactive', course, enrollment };
  }

  return { allowed: true, reason: 'allowed', course, enrollment };
}
