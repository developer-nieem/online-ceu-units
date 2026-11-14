-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'REWARDED');

-- CreateEnum
CREATE TYPE "ReferralRewardReason" AS ENUM ('REFERRAL_CONVERSION');

-- AlterTable: add referral columns (nullable until backfill)
ALTER TABLE "users" ADD COLUMN "referral_code" CHAR(8);
ALTER TABLE "users" ADD COLUMN "referred_by_code" CHAR(8);

-- Backfill unique referral codes for existing users (deterministic from id)
UPDATE "users"
SET "referral_code" = UPPER(SUBSTRING(MD5("id" || ':referral'), 1, 8))
WHERE "referral_code" IS NULL;

ALTER TABLE "users" ALTER COLUMN "referral_code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referree_id" TEXT NOT NULL,
    "referree_code" CHAR(8) NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "converted_at" TIMESTAMP(3),
    "rewarded_at" TIMESTAMP(3),
    "reward_amount_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" "ReferralRewardReason" NOT NULL,
    "applied_to_order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referree_id_key" ON "referrals"("referree_id");

-- CreateIndex
CREATE INDEX "referrals_tenant_id_status_idx" ON "referrals"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "referral_rewards_tenant_id_user_id_idx" ON "referral_rewards"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "referral_rewards_user_id_idx" ON "referral_rewards"("user_id");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referree_id_fkey" FOREIGN KEY ("referree_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_applied_to_order_id_fkey" FOREIGN KEY ("applied_to_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
