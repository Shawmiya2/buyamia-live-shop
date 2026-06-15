import { createAnalyticsEvent, readBackendStore, updateBackendStore } from "./store";
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
  const store = readBackendStore();
  const user = store.users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return {
    userId: user.id,
    profileType: user.profileType,
    verificationStatus: user.verificationStatus,
    documents: store.verificationDocuments[user.id] ?? [],
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

  const userId = input.userId.trim();
  const documentType = input.documentType.trim();
  updateBackendStore((store) => {
    const user = store.users.find((item) => item.id === userId);

    if (!user) {
      throw new Error("User not found.");
    }

    const metadata: VerificationDocumentMetadata = {
      documentType,
      uploadedAt: new Date().toISOString(),
      status: "pending",
      reviewNote:
        typeof input.reviewNote === "string" && input.reviewNote.trim()
          ? input.reviewNote.trim()
          : "Mock metadata submitted. No real document file stored.",
    };

    store.verificationDocuments[user.id] = [
      ...(store.verificationDocuments[user.id] ?? []),
      metadata,
    ];
  });

  return updateVerificationStatus(userId, "pending");
}

export function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
) {
  if (!isVerificationStatus(status)) {
    throw new Error("Invalid verification status.");
  }

  return updateBackendStore((store) => {
    const user = store.users.find((item) => item.id === userId);

    if (!user) {
      throw new Error("User not found.");
    }

    user.verificationStatus = status;

    if (user.providerId) {
      const provider = store.providers.find((item) => item.id === user.providerId);

      if (provider) {
        provider.verificationStatus = status;
      }
    }

    store.analyticsEvents.push(
      createAnalyticsEvent({
        type: "verification_updated",
        userId: user.id,
        providerId: user.providerId,
        metadata: { status },
      }),
    );

    return {
      userId: user.id,
      profileType: user.profileType,
      verificationStatus: user.verificationStatus,
      documents: store.verificationDocuments[user.id] ?? [],
    };
  });
}
