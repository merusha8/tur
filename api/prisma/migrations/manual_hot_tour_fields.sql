-- HotTour urgency & last-minute fields
ALTER TABLE "HotTour" ADD COLUMN IF NOT EXISTS "lastMinute" BOOLEAN DEFAULT false;
ALTER TABLE "HotTour" ADD COLUMN IF NOT EXISTS "seatsLeft" INTEGER;

UPDATE "HotTour" SET "seatsLeft" = 5 + floor(random() * 8)::int WHERE "seatsLeft" IS NULL;
UPDATE "HotTour" SET "lastMinute" = ("validUntil" <= NOW() + interval '7 days') WHERE "lastMinute" IS NULL;

ALTER TABLE "HotTour" ALTER COLUMN "lastMinute" SET NOT NULL;
ALTER TABLE "HotTour" ALTER COLUMN "lastMinute" SET DEFAULT false;
ALTER TABLE "HotTour" ALTER COLUMN "seatsLeft" SET NOT NULL;
ALTER TABLE "HotTour" ALTER COLUMN "seatsLeft" SET DEFAULT 10;

CREATE INDEX IF NOT EXISTS "HotTour_lastMinute_idx" ON "HotTour"("lastMinute");
CREATE INDEX IF NOT EXISTS "HotTour_discountPercent_idx" ON "HotTour"("discountPercent");
