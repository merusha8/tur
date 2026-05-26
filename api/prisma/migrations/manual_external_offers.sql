CREATE TABLE IF NOT EXISTS "ExternalOffer" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExternalOffer_type_expiresAt_idx" ON "ExternalOffer"("type", "expiresAt");
CREATE INDEX IF NOT EXISTS "ExternalOffer_provider_idx" ON "ExternalOffer"("provider");
