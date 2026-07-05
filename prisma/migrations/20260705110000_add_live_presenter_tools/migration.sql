CREATE TABLE "LivePresenterTool" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "defaultPayload" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "LiveToolActivation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "liveId" TEXT NOT NULL,
  "presenterId" TEXT NOT NULL,
  "toolType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "triggerReason" TEXT NOT NULL DEFAULT 'manual',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" DATETIME,
  CONSTRAINT "LiveToolActivation_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "Live" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LiveToolActivation_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "LiveViewerSignal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "liveId" TEXT NOT NULL,
  "viewerId" TEXT,
  "signalType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveViewerSignal_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "Live" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LiveViewerSignal_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LivePresenterTool_type_key" ON "LivePresenterTool"("type");
CREATE INDEX "LiveToolActivation_liveId_status_createdAt_idx" ON "LiveToolActivation"("liveId", "status", "createdAt");
CREATE INDEX "LiveToolActivation_presenterId_idx" ON "LiveToolActivation"("presenterId");
CREATE INDEX "LiveViewerSignal_liveId_signalType_createdAt_idx" ON "LiveViewerSignal"("liveId", "signalType", "createdAt");
CREATE INDEX "LiveViewerSignal_viewerId_idx" ON "LiveViewerSignal"("viewerId");
