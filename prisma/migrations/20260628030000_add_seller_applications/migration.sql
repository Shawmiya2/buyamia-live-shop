CREATE TABLE "SellerApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "companyDescription" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "productsOrServices" TEXT NOT NULL,
    "website" TEXT,
    "verificationDocuments" JSONB NOT NULL,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
