-- Migrate City to new schema (non-destructive)
ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "airportCode" TEXT;
ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "popular" BOOLEAN NOT NULL DEFAULT false;

UPDATE "City" SET "image" = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800' WHERE "image" IS NULL;
UPDATE "City" SET "popular" = COALESCE("isCapital", false) WHERE "popular" = false;

UPDATE "City" c
SET "airportCode" = a."iataCode"
FROM "Airport" a
WHERE a."cityId" = c.id AND c."airportCode" IS NULL;

ALTER TABLE "City" ALTER COLUMN "image" SET NOT NULL;

ALTER TABLE "City" DROP COLUMN IF EXISTS "nameLocal";
ALTER TABLE "City" DROP COLUMN IF EXISTS "population";
ALTER TABLE "City" DROP COLUMN IF EXISTS "isCapital";
ALTER TABLE "City" DROP COLUMN IF EXISTS "isResortArea";
ALTER TABLE "City" DROP COLUMN IF EXISTS "timezone";

CREATE INDEX IF NOT EXISTS "City_popular_idx" ON "City"("popular");
CREATE INDEX IF NOT EXISTS "City_airportCode_idx" ON "City"("airportCode");
DROP INDEX IF EXISTS "City_isResortArea_idx";
