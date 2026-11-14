import { EnrollmentStatus, type Enrollment, type Prisma } from '@calace/db';

import type { LearnerEnrollmentRecord, LearnerEnrollmentStatus } from './types';

export interface EnrollmentMetadata {
  progressPercent?: number;
  progressPct?: number;
  archived?: boolean;
  revoked?: boolean;
}

export function parseEnrollmentMetadata(raw: Prisma.JsonValue): EnrollmentMetadata {
  const data = raw as unknown as EnrollmentMetadata;
  // Nest writes `progressPct`; the legacy web path wrote `progressPercent`.
  // Prefer the Nest key, fall back to legacy, so both enrollment paths display correctly.
  const progress =
    typeof data?.progressPct === 'number'
      ? data.progressPct
      : typeof data?.progressPercent === 'number'
        ? data.progressPercent
        : 0;
  return {
    progressPercent: progress,
    progressPct: progress,
    archived: Boolean(data?.archived),
    revoked: Boolean(data?.revoked),
  };
}

export function toLearnerEnrollmentStatus(
  status: EnrollmentStatus,
  metadata: EnrollmentMetadata,
): LearnerEnrollmentStatus {
  if (metadata.revoked) {
    return 'revoked';
  }
  if (metadata.archived || status === EnrollmentStatus.EXPIRED) {
    return 'archived';
  }
  if (status === EnrollmentStatus.COMPLETED) {
    return 'completed';
  }
  if (
    status === EnrollmentStatus.ACTIVE ||
    status === EnrollmentStatus.PENDING
  ) {
    return 'active';
  }
  if (status === EnrollmentStatus.WITHDRAWN) {
    return 'archived';
  }
  if (status === EnrollmentStatus.REQUIRES_REPURCHASE || status === EnrollmentStatus.REQUIRES_RESET) {
    return 'requires_reset';
  }
  return 'not_enrolled';
}

type DbEnrollment = Enrollment & {
  courseVersion: {
    course: {
      id: string;
      slug: string;
      title: string;
    };
  };
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export function mapDbEnrollment(row: DbEnrollment): LearnerEnrollmentRecord {
  const metadata = parseEnrollmentMetadata(row.metadata);
  const course = row.courseVersion.course;

  return {
    id: row.id,
    userId: row.userId,
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    status: toLearnerEnrollmentStatus(row.status, metadata),
    progressPercent: metadata.progressPercent ?? 0,
    enrolledAt: row.enrolledAt.toISOString(),
    startedAt: row.startedAt?.toISOString(),
    completedAt: row.completedAt?.toISOString(),
  };
}

export function formatLearnerName(firstName: string | null, lastName: string | null, email: string) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email;
}
