-- Add required database foundation columns while preserving existing app data.
ALTER TABLE "ProviderProfile" ADD COLUMN "website" TEXT;

ALTER TABLE "VerificationRequest" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "VerificationRequest" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Live" ADD COLUMN "liveRequestId" TEXT;
ALTER TABLE "Live" ADD COLUMN "viewerCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Live" ADD COLUMN "replayViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Live" ADD COLUMN "conversionIntent" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "Live_liveRequestId_key" ON "Live"("liveRequestId");

ALTER TABLE "Rfq" ADD COLUMN "adminId" TEXT;
UPDATE "Rfq" SET "adminId" = "createdById" WHERE "adminId" IS NULL;

ALTER TABLE "Negotiation" ADD COLUMN "adminId" TEXT;
UPDATE "Negotiation" SET "adminId" = "createdById" WHERE "adminId" IS NULL;

ALTER TABLE "NegotiationMessage" ADD COLUMN "message" TEXT;
UPDATE "NegotiationMessage" SET "message" = "body" WHERE "message" IS NULL;

ALTER TABLE "RiskReview" ADD COLUMN "adminId" TEXT;
ALTER TABLE "RiskReview" ADD COLUMN "status" TEXT;
ALTER TABLE "RiskReview" ADD COLUMN "note" TEXT;
UPDATE "RiskReview" SET "adminId" = "reviewerId" WHERE "adminId" IS NULL;
UPDATE "RiskReview" SET "status" = "reviewStatus" WHERE "status" IS NULL;
UPDATE "RiskReview" SET "note" = "adminNote" WHERE "note" IS NULL;
