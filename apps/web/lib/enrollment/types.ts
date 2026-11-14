/** Learner-facing enrollment lifecycle (maps to Prisma `EnrollmentStatus` + metadata). */
export type LearnerEnrollmentStatus =
  | 'not_enrolled'
  | 'active'
  | 'completed'
  | 'archived'
  | 'revoked'
  | 'requires_reset'
  | 'requires_repurchase';

export interface LearnerEnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  status: LearnerEnrollmentStatus;
  progressPercent: number;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CreateEnrollmentInput {
  userId: string;
  courseSlug: string;
  /** How enrollment was created — affects payment validation. */
  source?: 'free' | 'admin' | 'checkout';
  orderId?: string;
}

export interface AdminEnrollmentRecord extends LearnerEnrollmentRecord {
  learnerEmail: string;
  learnerName: string;
}
