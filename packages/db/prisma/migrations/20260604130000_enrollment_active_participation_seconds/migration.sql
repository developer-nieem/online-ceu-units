-- CDPH online CE: denormalized active participation seconds per enrollment
ALTER TABLE "enrollments" ADD COLUMN "active_participation_seconds" INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing participation ledger in metadata
UPDATE "enrollments"
SET "active_participation_seconds" = COALESCE(
  (metadata->'participation'->'ledger'->>'activeSeconds')::INTEGER,
  (metadata->'participation'->>'activeSeconds')::INTEGER,
  ((metadata->'participation'->>'seatTimeMinutes')::INTEGER * 60),
  0
)
WHERE metadata->'participation' IS NOT NULL;
