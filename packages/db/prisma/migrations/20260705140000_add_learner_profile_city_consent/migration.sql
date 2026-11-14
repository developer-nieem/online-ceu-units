-- AlterTable
ALTER TABLE "learner_profiles" ADD COLUMN "city" TEXT,
ADD COLUMN "city_consent_given" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "city_consent_given_at" TIMESTAMP(3);
