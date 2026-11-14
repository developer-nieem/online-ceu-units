-- CreateEnum
CREATE TYPE "CourseMilestoneBadge" AS ENUM ('COURSES_3', 'COURSES_6', 'COURSES_9', 'COURSES_12');

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "milestone" "CourseMilestoneBadge" NOT NULL,
    "courses_at" INTEGER NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_badges_tenant_id_earned_at_idx" ON "user_badges"("tenant_id", "earned_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_milestone_key" ON "user_badges"("user_id", "milestone");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
