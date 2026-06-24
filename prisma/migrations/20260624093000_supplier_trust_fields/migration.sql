-- AlterTable
ALTER TABLE "ProviderProfile" ADD COLUMN "completedOrders" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProviderProfile" ADD COLUMN "responseRate" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProviderProfile" ADD COLUMN "responseMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProviderProfile" ADD COLUMN "certifications" JSONB;
ALTER TABLE "ProviderProfile" ADD COLUMN "bImpactScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProviderProfile" ADD COLUMN "certifiedReviews" INTEGER NOT NULL DEFAULT 0;
