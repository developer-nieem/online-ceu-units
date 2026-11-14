-- Enrollment attempt limit: track consumed course attempts per enrollment.
-- Note: enum values must be added before use. The backfill UPDATE that
-- referenced REQUIRES_REPURCHASE has been removed because:
-- 1. The live DB already has correct data from the original manual apply.
-- 2. The shadow DB is always empty so backfill is a no-op there anyway.
-- 3. Prisma 6 does not support no-transaction migrations, so the UPDATE
--    cannot safely reference a newly-added enum value.
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_REPURCHASE';
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_RESET';

ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "attempts_used" 
  INTEGER NOT NULL DEFAULT 0;
