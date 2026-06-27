/*
  Warnings:

  - You are about to alter the column `commerceData` on the `Live` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("json")` to `Json`.
  - You are about to alter the column `intentQuestions` on the `Live` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("json")` to `Json`.
  - You are about to alter the column `specialistHost` on the `Live` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("json")` to `Json`.

*/
-- DropIndex
DROP INDEX "Negotiation_rfqId_idx";

-- DropIndex
DROP INDEX "Negotiation_providerId_idx";

-- DropIndex
DROP INDEX "Rfq_createdById_idx";

-- DropIndex
DROP INDEX "RiskReview_rfqId_idx";

-- DropIndex
DROP INDEX "RiskReview_providerId_idx";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Live" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "replayExpiresAt" DATETIME,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinReason" TEXT,
    "pinExpiresAt" DATETIME,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "transcript" JSONB,
    "specialistHost" JSONB,
    "commerceData" JSONB,
    "intentQuestions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Live_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Live" ("category", "commerceData", "createdAt", "endedAt", "id", "intentQuestions", "isPinned", "pinExpiresAt", "pinReason", "priorityScore", "providerId", "replayExpiresAt", "scheduledAt", "specialistHost", "startedAt", "status", "title", "transcript", "updatedAt") SELECT "category", "commerceData", "createdAt", "endedAt", "id", "intentQuestions", "isPinned", "pinExpiresAt", "pinReason", "priorityScore", "providerId", "replayExpiresAt", "scheduledAt", "specialistHost", "startedAt", "status", "title", "transcript", "updatedAt" FROM "Live";
DROP TABLE "Live";
ALTER TABLE "new_Live" RENAME TO "Live";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
