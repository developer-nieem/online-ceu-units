-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('COURSE_PROGRESS', 'COMPLIANCE', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'SYSTEM', 'RETENTION_PLACEHOLDER', 'COMMUNITY_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "LearnerNotificationType" AS ENUM ('ENROLLMENT_CONFIRMATION', 'COURSE_REMINDER', 'INACTIVITY_REMINDER', 'PARTICIPATION_WARNING', 'EXAM_UNLOCK', 'EXAM_RESULT', 'CERTIFICATE_ISSUED', 'TRANSCRIPT_UPDATE', 'ADMIN_ANNOUNCEMENT', 'CMS_PUBLISH', 'COMMUNITY_PLACEHOLDER', 'LEARNER_NOTICE', 'COURSE_UPDATE', 'COHORT_MESSAGING_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('UNFINISHED_COURSE', 'INACTIVITY', 'INCOMPLETE_ATTESTATION', 'CERTIFICATE_READY', 'EXPIRATION_PLACEHOLDER', 'SUBSCRIPTION_RENEWAL_PLACEHOLDER');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('SCHEDULED', 'SENT', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL_LEARNERS', 'COURSE_ENROLLMENTS', 'COHORT_PLACEHOLDER');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "category" "NotificationCategory",
ADD COLUMN "notification_type" "LearnerNotificationType",
ADD COLUMN "action_href" TEXT,
ADD COLUMN "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notifications_user_id_channel_archived_at_idx" ON "notifications"("user_id", "channel", "archived_at");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_notification_type_idx" ON "notifications"("tenant_id", "notification_type");

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reminders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reminder_type" "ReminderType" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "dedupe_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "notification_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL_LEARNERS',
    "course_id" TEXT,
    "published_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_tenant_id_idx" ON "notification_preferences"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_reminders_notification_id_key" ON "scheduled_reminders"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_reminders_tenant_id_user_id_dedupe_key_key" ON "scheduled_reminders"("tenant_id", "user_id", "dedupe_key");

-- CreateIndex
CREATE INDEX "scheduled_reminders_status_scheduled_for_idx" ON "scheduled_reminders"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "scheduled_reminders_user_id_reminder_type_idx" ON "scheduled_reminders"("user_id", "reminder_type");

-- CreateIndex
CREATE INDEX "announcements_tenant_id_published_at_idx" ON "announcements"("tenant_id", "published_at");

-- CreateIndex
CREATE INDEX "announcements_course_id_idx" ON "announcements"("course_id");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
