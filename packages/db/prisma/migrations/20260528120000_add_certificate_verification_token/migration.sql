-- CreateEnum
CREATE TYPE "VerificationTokenStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "certificate_verification_tokens" (
    "id" TEXT NOT NULL,
    "certificate_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "VerificationTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "audit_log_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificate_verification_tokens_certificate_id_key" ON "certificate_verification_tokens"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_verification_tokens_token_key" ON "certificate_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "certificate_verification_tokens_token_status_idx" ON "certificate_verification_tokens"("token", "status");

-- AddForeignKey
ALTER TABLE "certificate_verification_tokens" ADD CONSTRAINT "certificate_verification_tokens_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
