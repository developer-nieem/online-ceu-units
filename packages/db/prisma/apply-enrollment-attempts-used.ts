/**
 * Idempotent schema patch: enrollment attempts_used + REQUIRES_REPURCHASE status.
 * Safe to run multiple times (no data loss). Use when migrate deploy is unavailable.
 *
 * Run: pnpm --filter @calace/db db:apply-enrollment-attempts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function applyEnrollmentAttemptsUsed(): Promise<{
  columnPresent: boolean;
  enrollmentsAtLimit: number;
}> {
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_REPURCHASE'`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "attempts_used" INTEGER NOT NULL DEFAULT 0`,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "enrollments" e
SET "attempts_used" = sub.cnt
FROM (
  SELECT
    aa.enrollment_id,
    COUNT(*)::INTEGER AS cnt
  FROM "assessment_attempts" aa
  INNER JOIN "assessments" a ON a.id = aa.assessment_id
  WHERE a.kind = 'FINAL_EXAM'
    AND aa.status IN ('PASSED', 'FAILED', 'GRADED', 'SUBMITTED')
  GROUP BY aa.enrollment_id
) sub
WHERE e.id = sub.enrollment_id
  AND e.attempts_used < sub.cnt`,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "enrollments" e
SET status = 'REQUIRES_RESET'
WHERE e.attempts_used >= 3
  AND e.status IN ('ACTIVE', 'PENDING')
  AND e.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "assessment_attempts" aa
    INNER JOIN "assessments" a ON a.id = aa.assessment_id
    WHERE aa.enrollment_id = e.id
      AND a.kind = 'FINAL_EXAM'
      AND aa.status = 'PASSED'
  )`,
  );

  const columnCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'enrollments'
        AND column_name = 'attempts_used'
    ) AS exists
  `;

  const atLimit = await prisma.enrollment.count({
    where: { attemptsUsed: { gte: 3 }, status: 'REQUIRES_REPURCHASE', deletedAt: null },
  });

  return {
    columnPresent: Boolean(columnCheck[0]?.exists),
    enrollmentsAtLimit: atLimit,
  };
}

async function main() {
  const result = await applyEnrollmentAttemptsUsed();
  console.log(
    `[@calace/db] enrollment attempts_used applied (column=${result.columnPresent}, requires_repurchase=${result.enrollmentsAtLimit})`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
