CREATE TABLE "AiSourcingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productDescription" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "targetCountry" TEXT NOT NULL,
    "preferredSupplierLocation" TEXT,
    "budget" REAL,
    "moqPreference" TEXT NOT NULL,
    "deliveryDeadline" DATETIME NOT NULL,
    "additionalRequirements" TEXT,
    "recommendations" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
