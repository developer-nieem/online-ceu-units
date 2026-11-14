-- AlterTable
ALTER TABLE "assessments" ADD COLUMN "integrity_settings" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "assessment_attempt_violations" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_ms" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_attempt_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_attempt_violations_attempt_id_occurred_at_idx" ON "assessment_attempt_violations"("attempt_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "assessment_attempt_violations" ADD CONSTRAINT "assessment_attempt_violations_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
