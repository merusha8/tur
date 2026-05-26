-- Review system: pros/cons, images, verified travelers
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "pros" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "cons" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Review_hotelId_idx" ON "Review"("hotelId");
CREATE INDEX IF NOT EXISTS "Review_tourId_idx" ON "Review"("tourId");
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");
CREATE INDEX IF NOT EXISTS "Review_verified_idx" ON "Review"("verified");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");
