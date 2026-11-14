-- AlterTable
-- Schema-only: allow null going forward. Do not backfill existing rows.
ALTER TABLE "learner_profiles" ALTER COLUMN "city_consent_given" DROP NOT NULL,
ALTER COLUMN "city_consent_given" DROP DEFAULT;
