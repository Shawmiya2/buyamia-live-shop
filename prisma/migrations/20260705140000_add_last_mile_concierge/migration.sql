-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "preferredContactMethod" TEXT NOT NULL DEFAULT 'platform',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "liveId" TEXT,
    "providerId" TEXT,
    "productOrServiceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "intentType" TEXT NOT NULL,
    "quantity" INTEGER,
    "budgetLabel" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'flexible',
    "status" TEXT NOT NULL DEFAULT 'captured',
    "addressId" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerIntent_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuyerIntent_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "Live" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BuyerIntent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BuyerIntent_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "BuyerAddress" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConciergeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerIntentId" TEXT NOT NULL,
    "assignedAgentName" TEXT NOT NULL DEFAULT 'Buyamia Concierge',
    "status" TEXT NOT NULL DEFAULT 'open',
    "requestedServices" JSONB NOT NULL,
    "conciergeNote" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConciergeRequest_buyerIntentId_fkey" FOREIGN KEY ("buyerIntentId") REFERENCES "BuyerIntent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConciergeAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conciergeRequestId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConciergeAction_conciergeRequestId_fkey" FOREIGN KEY ("conciergeRequestId") REFERENCES "ConciergeRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "outcomeType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outcome_buyerIntentId_fkey" FOREIGN KEY ("buyerIntentId") REFERENCES "BuyerIntent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_userId_key" ON "BuyerProfile"("userId");

-- CreateIndex
CREATE INDEX "BuyerAddress_userId_isDefault_idx" ON "BuyerAddress"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "BuyerIntent_buyerId_createdAt_idx" ON "BuyerIntent"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "BuyerIntent_providerId_liveId_idx" ON "BuyerIntent"("providerId", "liveId");

-- CreateIndex
CREATE INDEX "BuyerIntent_status_createdAt_idx" ON "BuyerIntent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConciergeRequest_status_createdAt_idx" ON "ConciergeRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConciergeRequest_buyerIntentId_idx" ON "ConciergeRequest"("buyerIntentId");

-- CreateIndex
CREATE INDEX "ConciergeAction_conciergeRequestId_status_idx" ON "ConciergeAction"("conciergeRequestId", "status");

-- CreateIndex
CREATE INDEX "Outcome_buyerIntentId_status_idx" ON "Outcome"("buyerIntentId", "status");
