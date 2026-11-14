import { EnrollmentStatus } from '@calace/db';

export type LearnerCourseState =
  | 'not_enrolled'
  | 'enrolled'
  | 'in_progress'
  | 'completed'
  | 'requires_reset';

export function deriveLearnerState(
  enrollment: { status: EnrollmentStatus; progressPct: number } | null,
): LearnerCourseState {
  if (!enrollment) return 'not_enrolled';
  if (
    enrollment.status === EnrollmentStatus.REQUIRES_RESET ||
    enrollment.status === EnrollmentStatus.REQUIRES_REPURCHASE
  ) {
    return 'requires_reset';
  }
  if (enrollment.status === EnrollmentStatus.COMPLETED || enrollment.progressPct >= 100) {
    return 'completed';
  }
  if (enrollment.progressPct > 0) return 'in_progress';
  if (enrollment.status === EnrollmentStatus.ACTIVE) return 'enrolled';
  return 'not_enrolled';
}
