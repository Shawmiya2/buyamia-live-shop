import { providers, users, verificationDocuments } from "./mock-data";
import type { VerificationDocumentMetadata, VerificationStatus } from "./types";

export const verificationStatuses: VerificationStatus[] = [
  "not_started",
  "pending",
  "verified",
  "rejected",
  "needs_more_info",
];

export function isVerificationStatus(value: unknown): value is VerificationStatus {
  return (
    typeof value === "string" &&
    verificationStatuses.includes(value as VerificationStatus)
  );
}

export function getVerificationStatus(userId: string) {
  const user = users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return {
    userId: user.id,
    profileType: user.profileType,
    verificationStatus: user.verificationStatus,
    documents: verificationDocuments[user.id] ?? [],
  };
}

export function submitVerificationMetadata(input: {
  userId: unknown;
  documentType: unknown;
  reviewNote?: unknown;
}) {
  if (typeof input.userId !== "string" || !input.userId.trim()) {
    throw new Error("userId is required.");
  }

  if (typeof input.documentType !== "string" || !input.documentType.trim()) {
    throw new Error("documentType is required.");
  }

  const user = users.find((item) => item.id === input.userId);

  if (!user) {
    throw new Error("User not found.");
  }

  const metadata: VerificationDocumentMetadata = {
    documentType: input.documentType.trim(),
    uploadedAt: new Date().toISOString(),
    status: "pending",
    reviewNote:
      typeof input.reviewNote === "string" && input.reviewNote.trim()
        ? input.reviewNote.trim()
        : "Mock metadata submitted. No real document file stored.",
  };

  verificationDocuments[user.id] = [
    ...(verificationDocuments[user.id] ?? []),
    metadata,
  ];
  updateVerificationStatus(user.id, "pending");

  return getVerificationStatus(user.id);
}

export function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
) {
  if (!isVerificationStatus(status)) {
    throw new Error("Invalid verification status.");
  }

  const user = users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.verificationStatus = status;

  if (user.providerId) {
    const provider = providers.find((item) => item.id === user.providerId);

    if (provider) {
      provider.verificationStatus = status;
    }
  }

  return getVerificationStatus(user.id);
}
