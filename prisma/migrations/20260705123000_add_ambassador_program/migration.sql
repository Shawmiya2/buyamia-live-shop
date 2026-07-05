CREATE TABLE "AmbassadorProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'not_started',
  "referralCode" TEXT NOT NULL,
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "tier" TEXT NOT NULL DEFAULT 'starter',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AmbassadorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Referral" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ambassadorId" TEXT NOT NULL,
  "referredEmail" TEXT,
  "referredUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'invited',
  "source" TEXT NOT NULL DEFAULT 'referral_link',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "convertedAt" DATETIME,
  CONSTRAINT "Referral_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "AmbassadorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "RewardLedger" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ambassadorId" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "sourceAmount" REAL,
  "sourceCurrency" TEXT,
  "note" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RewardLedger_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "AmbassadorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CommunityShare" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "liveId" TEXT,
  "providerId" TEXT,
  "channel" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityShare_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "Live" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CommunityShare_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AmbassadorProfile_userId_key" ON "AmbassadorProfile"("userId");
CREATE UNIQUE INDEX "AmbassadorProfile_referralCode_key" ON "AmbassadorProfile"("referralCode");
CREATE INDEX "AmbassadorProfile_status_tier_idx" ON "AmbassadorProfile"("status", "tier");
CREATE INDEX "Referral_ambassadorId_status_createdAt_idx" ON "Referral"("ambassadorId", "status", "createdAt");
CREATE INDEX "Referral_referredUserId_idx" ON "Referral"("referredUserId");
CREATE INDEX "RewardLedger_ambassadorId_createdAt_idx" ON "RewardLedger"("ambassadorId", "createdAt");
CREATE INDEX "RewardLedger_reason_idx" ON "RewardLedger"("reason");
CREATE INDEX "CommunityShare_userId_createdAt_idx" ON "CommunityShare"("userId", "createdAt");
CREATE INDEX "CommunityShare_liveId_createdAt_idx" ON "CommunityShare"("liveId", "createdAt");
CREATE INDEX "CommunityShare_providerId_createdAt_idx" ON "CommunityShare"("providerId", "createdAt");
