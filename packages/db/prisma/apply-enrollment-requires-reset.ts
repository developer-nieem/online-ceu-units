/**
 * Idempotent schema patch: REQUIRES_RESET enrollment status + migrate legacy rows.
 * Safe to run multiple times (no data loss).
 *
 * Run: pnpm --filter @calace/db db:apply-enrollment-reset
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function applyEnrollmentRequiresReset(): Promise<{
  migratedFromRepurchase: number;
  requiresResetCount: number;
}> {
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_RESET'`,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "enrollments" SET status = 'REQUIRES_RESET' WHERE status::text = 'REQUIRES_REPURCHASE' AND deleted_at IS NULL`,
  );

  const requiresResetCount = await prisma.enrollment.count({
    where: { status: 'REQUIRES_RESET', deletedAt: null },
  });

  return {
    migratedFromRepurchase: requiresResetCount,
    requiresResetCount,
  };
}

async function main() {
  const result = await applyEnrollmentRequiresReset();
  console.log(
    `[@calace/db] REQUIRES_RESET applied (requires_reset=${result.requiresResetCount})`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
