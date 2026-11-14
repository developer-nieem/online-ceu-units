import { apiFetch } from './api';
import type { LearnerCourseState } from './learner-state';

export type ProgressSummary = {
  activeCourses: Array<{
    courseSlug: string;
    courseTitle: string;
    progressPct: number;
    learnerState: LearnerCourseState;
    resumeLessonSlug: string | null;
    completedLessons: number;
    totalLessons: number;
  }>;
  recentlyCompleted: Array<{
    enrollmentId: string;
    courseSlug: string;
    courseTitle: string;
    completedAt: string;
    ceHours: number;
  }>;
  ceuHoursEarned: number;
  ceuHoursEarnedNote: string;
  completedCoursesCount?: number;
  milestoneBadgesEarned?: number;
};

export async function fetchProgressSummary() {
  return apiFetch<ProgressSummary>('/progress/summary');
}
