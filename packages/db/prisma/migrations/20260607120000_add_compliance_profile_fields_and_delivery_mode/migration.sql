-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('ONLINE', 'IN_PERSON', 'BLENDED', 'OTHER');

-- AlterTable
ALTER TABLE "course_versions" ADD COLUMN     "delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "learner_profiles" ADD COLUMN     "birth_day" INTEGER,
ADD COLUMN     "birth_month" INTEGER,
ADD COLUMN     "license_effective_on" DATE;

-- AlterTable
ALTER TABLE "transcript_entries" ADD COLUMN     "delivery_mode" "DeliveryMode";
