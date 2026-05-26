-- Migrate Hotel to new schema (non-destructive)
ALTER TABLE "Hotel" ADD COLUMN IF NOT EXISTS "mealType" TEXT;
ALTER TABLE "Hotel" ADD COLUMN IF NOT EXISTS "roomTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Hotel" ADD COLUMN IF NOT EXISTS "coordinates" JSONB;
ALTER TABLE "Hotel" ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER;

UPDATE "Hotel" SET "reviewsCount" = COALESCE("reviewCount", 0) WHERE "reviewsCount" IS NULL;
UPDATE "Hotel" SET "mealType" = 'Breakfast Only' WHERE "mealType" IS NULL;
UPDATE "Hotel" SET "coordinates" = jsonb_build_object('lat', COALESCE("latitude", 0), 'lng', COALESCE("longitude", 0))
WHERE "coordinates" IS NULL;
UPDATE "Hotel" SET "roomTypes" = ARRAY['Standard', 'Deluxe'] WHERE cardinality("roomTypes") = 0;

ALTER TABLE "Hotel" ALTER COLUMN "reviewsCount" SET NOT NULL;
ALTER TABLE "Hotel" ALTER COLUMN "reviewsCount" SET DEFAULT 0;
ALTER TABLE "Hotel" ALTER COLUMN "mealType" SET NOT NULL;
ALTER TABLE "Hotel" ALTER COLUMN "coordinates" SET NOT NULL;

ALTER TABLE "Hotel" DROP CONSTRAINT IF EXISTS "Hotel_destinationId_fkey";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "description";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "city";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "country";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "address";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "reviewCount";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "freebies";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "destinationId";

-- Ensure cityId is required (drop rows without city if any)
DELETE FROM "Hotel" WHERE "cityId" IS NULL;
ALTER TABLE "Hotel" ALTER COLUMN "cityId" SET NOT NULL;

DROP INDEX IF EXISTS "Hotel_city_idx";
CREATE INDEX IF NOT EXISTS "Hotel_rating_idx" ON "Hotel"("rating");
