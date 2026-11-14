import { apiFetch } from './api';
import type { LearnerCourseState } from './learner-state';
import type { PurchasePlanId } from './pricing';

export type EnrollmentSummary = {
  id: string;
  courseVersionId: string;
  courseSlug: string;
  courseTitle: string;
  ceHours: number;
  status: string;
  learnerState: LearnerCourseState;
  progressPct: number;
  totalLessons: number;
  completedLessons?: number;
  lastLessonSlug?: string | null;
  resumeLessonSlug?: string | null;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  attemptsUsed: number;
  maxAttempts: number;
  requiresReset: boolean;
  canRestart: boolean;
  courseRestartPath: string | null;
  /** @deprecated Use requiresReset */
  requiresRepurchase?: boolean;
  /** @deprecated Use courseRestartPath */
  repurchaseCheckoutPath?: string | null;
  canAccessLearn: boolean;
};

export type CourseEnrollmentStatus = {
  courseSlug: string;
  courseVersionId: string;
  enrollment: EnrollmentSummary | null;
  learnerState: LearnerCourseState;
  progressPct: number;
  totalLessons: number;
  hasActiveSubscription: boolean;
  subscriptionPlanCode: string | null;
};

export type RecentlyViewedItem = {
  slug: string;
  title: string;
  viewedAt: string;
};

export async function fetchMyEnrollments() {
  return apiFetch<EnrollmentSummary[]>('/enrollments/my');
}

export async function fetchEnrollmentForCourse(courseSlug: string) {
  return apiFetch<CourseEnrollmentStatus>(`/enrollments/course/${courseSlug}`);
}

export async function enrollInCourse(courseSlug: string, purchasePlan: PurchasePlanId) {
  return apiFetch<{ message: string; enrollment: EnrollmentSummary }>('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ courseSlug, purchasePlan }),
  });
}

export async function updateEnrollmentProgress(enrollmentId: string, progressPct: number) {
  return apiFetch<EnrollmentSummary>(`/enrollments/${enrollmentId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ progressPct }),
  });
}

export async function trackCourseView(courseSlug: string) {
  return apiFetch<{ ok: boolean }>('/enrollments/track-view', {
    method: 'POST',
    body: JSON.stringify({ courseSlug }),
  });
}

export async function restartCourse(courseSlug: string) {
  return apiFetch<{
    message: string;
    enrollment: EnrollmentSummary;
    resumeLessonSlug: string | null;
  }>(`/enrollments/course/${courseSlug}/restart`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchRecentlyViewed() {
  return apiFetch<RecentlyViewedItem[]>('/enrollments/recently-viewed');
}
