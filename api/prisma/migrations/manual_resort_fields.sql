-- Migrate Resort to new schema (non-destructive)
ALTER TABLE "Resort" ADD COLUMN IF NOT EXISTS "beachType" TEXT;

UPDATE "Resort" SET "beachType" = COALESCE("type", 'Sandy') WHERE "beachType" IS NULL;

ALTER TABLE "Resort" ALTER COLUMN "beachType" SET NOT NULL;

UPDATE "Resort" SET "images" = ARRAY["image"] WHERE "images" IS NULL OR cardinality("images") = 0;

ALTER TABLE "Resort" DROP CONSTRAINT IF EXISTS "Resort_countryId_fkey";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "countryId";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "stars";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "reviewCount";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "image";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "amenities";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "beachAccess";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "skiAccess";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "isFeatured";

DROP INDEX IF EXISTS "Resort_countryId_idx";
DROP INDEX IF EXISTS "Resort_type_idx";
CREATE INDEX IF NOT EXISTS "Resort_beachType_idx" ON "Resort"("beachType");
CREATE INDEX IF NOT EXISTS "Resort_rating_idx" ON "Resort"("rating");
