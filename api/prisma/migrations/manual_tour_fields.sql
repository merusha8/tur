-- Migrate Tour to new schema (non-destructive)
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "hotelId" TEXT;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "departureDate" TIMESTAMP(3);
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "returnDate" TIMESTAMP(3);
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "oldPrice" DOUBLE PRECISION;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "hotTour" BOOLEAN DEFAULT false;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "allInclusive" BOOLEAN DEFAULT false;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "availableSeats" INTEGER;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "airline" TEXT;

UPDATE "Tour" t
SET "countryId" = c."countryId"
FROM "City" c
WHERE t."cityId" = c.id AND t."countryId" IS NULL;

UPDATE "Tour" t
SET "hotelId" = (
  SELECT h.id FROM "Hotel" h WHERE h."cityId" = t."cityId" LIMIT 1
)
WHERE t."hotelId" IS NULL;

UPDATE "Tour"
SET "departureDate" = NOW() + interval '30 days'
WHERE "departureDate" IS NULL;

UPDATE "Tour"
SET "returnDate" = "departureDate" + ("duration" || ' days')::interval
WHERE "returnDate" IS NULL;

UPDATE "Tour" SET "availableSeats" = COALESCE("maxGuests", 20) WHERE "availableSeats" IS NULL;
UPDATE "Tour" SET "airline" = 'Air Astana' WHERE "airline" IS NULL;
UPDATE "Tour" SET "hotTour" = COALESCE("featured", false) WHERE "hotTour" IS NULL;
UPDATE "Tour" SET "allInclusive" = false WHERE "allInclusive" IS NULL;
UPDATE "Tour" SET "images" = ARRAY["image"] WHERE cardinality("images") = 0 AND "image" IS NOT NULL;

ALTER TABLE "Tour" DROP CONSTRAINT IF EXISTS "Tour_destinationId_fkey";
ALTER TABLE "Tour" DROP CONSTRAINT IF EXISTS "Tour_resortId_fkey";
ALTER TABLE "Tour" DROP CONSTRAINT IF EXISTS "Tour_categoryId_fkey";

DELETE FROM "Tour" WHERE "countryId" IS NULL OR "hotelId" IS NULL OR "cityId" IS NULL;

ALTER TABLE "Tour" ALTER COLUMN "countryId" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "cityId" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "hotelId" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "departureDate" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "returnDate" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "availableSeats" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "availableSeats" SET DEFAULT 20;
ALTER TABLE "Tour" ALTER COLUMN "airline" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "hotTour" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "hotTour" SET DEFAULT false;
ALTER TABLE "Tour" ALTER COLUMN "allInclusive" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "allInclusive" SET DEFAULT false;

DROP INDEX IF EXISTS "Tour_slug_key";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "destinationId";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "resortId";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "categoryId";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "location";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "image";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "rating";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "reviewCount";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "category";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "travelType";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "maxGuests";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "includes";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "itinerary";
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "featured";

DROP INDEX IF EXISTS "Tour_categoryId_idx";
DROP INDEX IF EXISTS "Tour_resortId_idx";
CREATE INDEX IF NOT EXISTS "Tour_countryId_idx" ON "Tour"("countryId");
CREATE INDEX IF NOT EXISTS "Tour_hotelId_idx" ON "Tour"("hotelId");
CREATE INDEX IF NOT EXISTS "Tour_departureDate_idx" ON "Tour"("departureDate");
CREATE INDEX IF NOT EXISTS "Tour_hotTour_idx" ON "Tour"("hotTour");

ALTER TABLE "Tour" DROP CONSTRAINT IF EXISTS "Tour_countryId_fkey";
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_countryId_fkey"
  FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tour" DROP CONSTRAINT IF EXISTS "Tour_hotelId_fkey";
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
