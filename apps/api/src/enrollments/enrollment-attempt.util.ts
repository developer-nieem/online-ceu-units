import { EnrollmentStatus, Prisma } from '@calace/db';

import type { PrismaService } from '../prisma/prisma.service';
import {
  enrollmentAttemptsExhausted,
  MAX_ENROLLMENT_COURSE_ATTEMPTS,
} from './enrollment-attempt.constants';

export type EnrollmentAttemptUsageResult = {
  attemptsUsed: number;
  requiresReset: boolean;
};

/** Increment enrollment attempt counter after a final exam submission. */
export async function incrementEnrollmentAttemptUsage(
  prisma: PrismaService,
  enrollmentId: string,
  _courseSlug: string,
  passed: boolean,
): Promise<EnrollmentAttemptUsageResult> {
  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { attemptsUsed: { increment: 1 } },
    select: { attemptsUsed: true, metadata: true },
  });

  const requiresReset = !passed && enrollmentAttemptsExhausted(updated.attemptsUsed);
  if (requiresReset) {
    await markEnrollmentRequiresReset(prisma, enrollmentId, {
      attemptsUsed: updated.attemptsUsed,
      metadata: updated.metadata,
    });
  }

  return { attemptsUsed: updated.attemptsUsed, requiresReset };
}

export async function markEnrollmentRequiresReset(
  prisma: PrismaService,
  enrollmentId: string,
  snapshot?: { attemptsUsed: number; metadata: Prisma.JsonValue },
) {
  const enrollment =
    snapshot ??
    (await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { attemptsUsed: true, metadata: true },
    }));
  if (!enrollment) return;

  const meta = (enrollment.metadata ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.REQUIRES_RESET,
      metadata: {
        ...meta,
        attemptsExhaustedAt: now,
        fulfillment: {
          ...((meta.fulfillment ?? {}) as Record<string, unknown>),
          fulfillmentStatus: 'requires_reset',
          requiresReset: true,
          attemptsUsed: enrollment.attemptsUsed,
          maxAttempts: MAX_ENROLLMENT_COURSE_ATTEMPTS,
          exhaustedAt: now,
        },
      } as Prisma.InputJsonValue,
    },
  });
}

/** @deprecated Alias for markEnrollmentRequiresReset. */
export const markEnrollmentRequiresRepurchase = markEnrollmentRequiresReset;

export function assertEnrollmentAttemptsAvailable(
  enrollment: { attemptsUsed: number; status: EnrollmentStatus },
  courseSlug: string,
): void {
  if (
    enrollment.status === EnrollmentStatus.REQUIRES_RESET ||
    enrollment.status === EnrollmentStatus.REQUIRES_REPURCHASE ||
    enrollmentAttemptsExhausted(enrollment.attemptsUsed)
  ) {
    const err = new Error(
      'Exam locked after 3 attempts. Restart this course from the beginning or choose another course.',
    ) as Error & { code: string; courseSlug: string };
    err.code = 'REQUIRES_RESET';
    err.courseSlug = courseSlug;
    throw err;
  }
}
