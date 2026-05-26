-- Migrate Country to new schema (non-destructive)
ALTER TABLE "Country" ADD COLUMN IF NOT EXISTS "flag" TEXT;
ALTER TABLE "Country" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "Country" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "Country" ADD COLUMN IF NOT EXISTS "visaRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Country" ADD COLUMN IF NOT EXISTS "description" TEXT;

UPDATE "Country" SET "flag" = COALESCE("flagEmoji", '🏳️') WHERE "flag" IS NULL;
UPDATE "Country" SET "currency" = 'USD' WHERE "currency" IS NULL;
UPDATE "Country" SET "language" = 'English' WHERE "language" IS NULL;
UPDATE "Country" SET "description" = "name" || ' — travel destination.' WHERE "description" IS NULL OR "description" = '';

ALTER TABLE "Country" ALTER COLUMN "flag" SET NOT NULL;
ALTER TABLE "Country" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "Country" ALTER COLUMN "language" SET NOT NULL;
ALTER TABLE "Country" ALTER COLUMN "description" SET NOT NULL;

ALTER TABLE "Country" DROP COLUMN IF EXISTS "nameRu";
ALTER TABLE "Country" DROP COLUMN IF EXISTS "region";
ALTER TABLE "Country" DROP COLUMN IF EXISTS "population";
ALTER TABLE "Country" DROP COLUMN IF EXISTS "flagEmoji";

CREATE INDEX IF NOT EXISTS "Country_code_idx" ON "Country"("code");
CREATE INDEX IF NOT EXISTS "Country_visaRequired_idx" ON "Country"("visaRequired");
