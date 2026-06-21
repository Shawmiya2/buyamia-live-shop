import { z } from "zod";
import type { LiveRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";
import { datePlusDays, defaultReplayAvailabilityDays } from "./replay-policy";

const createSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(5),
  preferredDate: z.string().min(1),
  documentMetadata: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "pending_review"]).default("pending_review"),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(["draft", "pending_review", "canceled"]).optional(),
});

export async function createLiveRequest(providerId: string, input: unknown) {
  const parsed = createSchema.parse(input);
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Provider not found.", 404);
  }

  const request = await prisma.liveRequest.create({
    data: {
      providerId,
      title: parsed.title,
      category: parsed.category,
      description: parsed.description,
      preferredDate: new Date(parsed.preferredDate),
      status: parsed.status,
      documentsStatus: parsed.documentMetadata ? "pending" : "not_started",
      paymentStatus: "placeholder",
    },
  });

  await createAnalyticsEvent({
    userId: provider.userId,
    providerId,
    eventType: "live_request_submitted",
    metadata: { liveRequestId: request.id, status: request.status },
  });

  return request;
}

export async function listLiveRequests(options: { providerId?: string; pendingOnly?: boolean } = {}) {
  return prisma.liveRequest.findMany({
    where: {
      providerId: options.providerId,
      status: options.pendingOnly ? "pending_review" : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLiveRequest(id: string) {
  const request = await prisma.liveRequest.findUnique({ where: { id } });
  if (!request) {
    throw new ApiError("not_found", "Live request not found.", 404);
  }
  return request;
}

export async function updateLiveRequest(providerId: string, id: string, input: unknown) {
  const request = await getLiveRequest(id);
  if (request.providerId !== providerId) {
    throw new ApiError("forbidden", "You cannot modify another provider's request.", 403);
  }
  if (!["draft", "pending_review"].includes(request.status)) {
    throw new ApiError("invalid_state", "This request can no longer be edited.", 400);
  }

  const parsed = updateSchema.parse(input);
  return prisma.liveRequest.update({
    where: { id },
    data: {
      title: parsed.title,
      category: parsed.category,
      description: parsed.description,
      preferredDate: parsed.preferredDate ? new Date(parsed.preferredDate) : undefined,
      status: parsed.status as LiveRequestStatus | undefined,
      documentsStatus: parsed.documentMetadata ? "pending" : undefined,
    },
  });
}

export async function cancelLiveRequest(providerId: string, id: string) {
  const request = await getLiveRequest(id);
  if (request.providerId !== providerId) {
    throw new ApiError("forbidden", "You cannot cancel another provider's request.", 403);
  }
  if (!["draft", "pending_review"].includes(request.status)) {
    throw new ApiError("invalid_state", "This request can no longer be canceled.", 400);
  }
  return prisma.liveRequest.update({ where: { id }, data: { status: "canceled" } });
}

export async function reviewLiveRequest(input: {
  adminId: string;
  requestId: string;
  status: "approved" | "rejected";
  adminNote?: string;
}) {
  const request = await getLiveRequest(input.requestId);
  const updated = await prisma.liveRequest.update({
    where: { id: input.requestId },
    data: { status: input.status, adminNote: input.adminNote },
  });

  await prisma.adminActivity.create({
    data: {
      adminId: input.adminId,
      action: `live_request_${input.status}`,
      targetType: "live_request",
      targetId: request.id,
      message: input.adminNote ?? `Live request ${input.status}.`,
    },
  });

  await createAnalyticsEvent({
    providerId: request.providerId,
    eventType: input.status === "approved" ? "live_request_approved" : "live_request_rejected",
    metadata: { liveRequestId: request.id },
  });

  return updated;
}

export async function scheduleApprovedLiveRequest(input: {
  adminId: string;
  requestId: string;
  scheduledAt: string;
}) {
  const request = await getLiveRequest(input.requestId);
  if (request.status !== "approved") {
    throw new ApiError("invalid_state", "Only approved requests can be scheduled.", 400);
  }

  const live = await prisma.live.create({
    data: {
      providerId: request.providerId,
      title: request.title,
      category: request.category,
      status: "scheduled",
      scheduledAt: new Date(input.scheduledAt),
      replayExpiresAt: datePlusDays(new Date(input.scheduledAt), defaultReplayAvailabilityDays),
    },
  });

  await prisma.liveRequest.update({
    where: { id: request.id },
    data: { status: "scheduled" },
  });

  await prisma.adminActivity.create({
    data: {
      adminId: input.adminId,
      action: "live_request_scheduled",
      targetType: "live_request",
      targetId: request.id,
      message: "Scheduled approved live request.",
    },
  });

  return live;
}
