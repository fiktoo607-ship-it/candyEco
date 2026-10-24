-- AlterTable
-- Add isPublished column to Product with default true and backfill existing rows (Issue #135)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT true;

-- Backfill existing products to true where isPublished is NULL
UPDATE "Product" SET "isPublished" = true WHERE "isPublished" IS NULL;
