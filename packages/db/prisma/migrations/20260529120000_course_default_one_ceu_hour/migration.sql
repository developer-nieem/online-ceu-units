-- Launch catalog default: 1 CE hour per course unless explicitly set otherwise
ALTER TABLE "courses" ALTER COLUMN "ce_hours" SET DEFAULT 1;
