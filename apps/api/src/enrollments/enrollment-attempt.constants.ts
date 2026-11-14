import { EnrollmentStatus } from '@calace/db';

/** Maximum course attempts (final exam submissions) included per enrollment. */
export const MAX_ENROLLMENT_COURSE_ATTEMPTS = 3;

export function enrollmentAttemptsExhausted(attemptsUsed: number): boolean {
  return attemptsUsed >= MAX_ENROLLMENT_COURSE_ATTEMPTS;
}

/** Whether the enrollment must restart the course after exhausting exam attempts. */
export function enrollmentRequiresReset(status: EnrollmentStatus): boolean {
  return (
    status === EnrollmentStatus.REQUIRES_RESET ||
    status === EnrollmentStatus.REQUIRES_REPURCHASE
  );
}

export function courseRestartPath(courseSlug: string): string {
  return `/courses/${courseSlug}/exam`;
}

/** @deprecated Use courseRestartPath — kept for legacy API fields. */
export function repurchaseCheckoutPath(courseSlug: string): string {
  return courseRestartPath(courseSlug);
}
