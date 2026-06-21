import { z } from "zod";
import type { Prisma, VerificationStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";

export const verificationStatuses = [
  "not_started",
  "pending",
  "verified",
  "rejected",
  "needs_more_info",
] as const;

const submitSchema = z.object({
  documentType: z.string().min(2),
  documentMetadata: z.record(z.string(), z.unknown()).default({}),
});

export const documentVerificationAdapter = {
  async storeMetadataOnly(metadata: Record<string, unknown>) {
    return metadata;
  },
};

export function isVerificationStatus(value: unknown): value is VerificationStatus {
  return typeof value === "string" && verificationStatuses.includes(value as VerificationStatus);
}

export async function getVerificationStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { verificationRequests: { orderBy: { submittedAt: "desc" } } },
  });
  if (!user) {
    throw new ApiError("not_found", "User not found.", 404);
  }

  return {
    userId: user.id,
    profileType: user.role,
    verificationStatus: user.verificationStatus,
    documents: user.verificationRequests,
    reviewNote: user.verificationRequests[0]?.reviewNote ?? null,
  };
}

export async function submitVerificationMetadata(userId: string, input: unknown) {
  const parsed = submitSchema.parse(input);
  const metadata = await documentVerificationAdapter.storeMetadataOnly(parsed.documentMetadata);

  const request = await prisma.verificationRequest.create({
    data: {
      userId,
      status: "pending",
      documentType: parsed.documentType,
      documentMetadata: metadata as Prisma.InputJsonValue,
      reviewNote: "Metadata submitted. No real identity files are stored.",
    },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { verificationStatus: "pending" },
    include: { providerProfile: true },
  });

  await createAnalyticsEvent({
    userId,
    providerId: user.providerProfile?.id,
    eventType: "verification_submitted",
    metadata: { verificationRequestId: request.id },
  });

  return getVerificationStatus(userId);
}

export async function reviewVerification(input: {
  adminId: string;
  userId: string;
  status: VerificationStatus;
  reviewNote?: string;
}) {
  if (!isVerificationStatus(input.status)) {
    throw new ApiError("invalid_status", "Invalid verification status.", 400);
  }

  const user = await prisma.user.update({
    where: { id: input.userId },
    data: { verificationStatus: input.status },
    include: { providerProfile: true, verificationRequests: { orderBy: { submittedAt: "desc" }, take: 1 } },
  });

  if (user.verificationRequests[0]) {
    await prisma.verificationRequest.update({
      where: { id: user.verificationRequests[0].id },
      data: {
        status: input.status,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
      },
    });
  }

  await prisma.adminActivity.create({
    data: {
      adminId: input.adminId,
      action: `verification_${input.status}`,
      targetType: "user",
      targetId: input.userId,
      message: input.reviewNote ?? `Verification ${input.status}.`,
    },
  });

  await createAnalyticsEvent({
    userId: input.userId,
    providerId: user.providerProfile?.id,
    eventType: "verification_reviewed",
    metadata: { status: input.status },
  });

  return getVerificationStatus(input.userId);
}

export const updateVerificationStatus = (userId: string, status: VerificationStatus) =>
  reviewVerification({ adminId: userId, userId, status });
