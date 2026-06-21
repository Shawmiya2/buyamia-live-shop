import { z } from "zod";
import type { LiveRequestStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";
import { datePlusDays, defaultReplayAvailabilityDays } from "./replay-policy";
import { fieldErrorsFromZod } from "./validation";

export const liveRequestFieldMessages = {
  title: "Please enter a live title.",
  category: "Please select a category.",
  description: "Please describe the live.",
  preferredDate: "Please select a preferred date.",
  preferredDatePast: "The preferred date cannot be in the past.",
} as const;

const liveRequestBaseSchema = z.object({
  title: z.string().trim().min(1, liveRequestFieldMessages.title),
  category: z.string().trim().min(1, liveRequestFieldMessages.category),
  description: z.string().trim().min(1, liveRequestFieldMessages.description),
  preferredDate: z.string().trim().min(1, liveRequestFieldMessages.preferredDate),
  documentMetadata: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "pending_review"]).default("pending_review"),
});

const createSchema = liveRequestBaseSchema.superRefine((value, context) => {
  if (!value.preferredDate) {
    return;
  }

  const preferredDate = parsePreferredDate(value.preferredDate);
  if (!preferredDate) {
    context.addIssue({ code: "custom", path: ["preferredDate"], message: liveRequestFieldMessages.preferredDate });
    return;
  }

  if (isBeforeToday(preferredDate)) {
    context.addIssue({ code: "custom", path: ["preferredDate"], message: liveRequestFieldMessages.preferredDatePast });
  }
});

const updateSchema = liveRequestBaseSchema.partial().extend({
  status: z.enum(["draft", "pending_review", "canceled"]).optional(),
}).superRefine((value, context) => {
  if (!value.preferredDate) {
    return;
  }

  const preferredDate = parsePreferredDate(value.preferredDate);
  if (!preferredDate) {
    context.addIssue({ code: "custom", path: ["preferredDate"], message: liveRequestFieldMessages.preferredDate });
    return;
  }

  if (isBeforeToday(preferredDate)) {
    context.addIssue({ code: "custom", path: ["preferredDate"], message: liveRequestFieldMessages.preferredDatePast });
  }
});

const liveRequestInclude = {
  provider: {
    select: {
      displayName: true,
      category: true,
      user: { select: { name: true, role: true } },
    },
  },
} as const;

function parsePreferredDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isBeforeToday(value: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(value);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today;
}

function parseCreateLiveRequestInput(input: unknown) {
  const parsed = createSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  return parsed.data;
}

function parseUpdateLiveRequestInput(input: unknown) {
  const parsed = updateSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  return parsed.data;
}

export async function createLiveRequest(providerId: string, input: unknown) {
  const parsed = parseCreateLiveRequestInput(input);
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
      preferredDate: parsePreferredDate(parsed.preferredDate)!,
      status: parsed.status,
      documentsStatus: parsed.documentMetadata ? "pending" : "not_started",
      paymentStatus: "placeholder",
    },
    include: liveRequestInclude,
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
    include: liveRequestInclude,
  });
}

export async function getLiveRequest(id: string) {
  const request = await prisma.liveRequest.findUnique({ where: { id }, include: liveRequestInclude });
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

  const parsed = parseUpdateLiveRequestInput(input);
  return prisma.liveRequest.update({
    where: { id },
    data: {
      title: parsed.title,
      category: parsed.category,
      description: parsed.description,
      preferredDate: parsed.preferredDate ? parsePreferredDate(parsed.preferredDate)! : undefined,
      status: parsed.status as LiveRequestStatus | undefined,
      documentsStatus: parsed.documentMetadata ? "pending" : undefined,
    },
    include: liveRequestInclude,
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
  return prisma.liveRequest.update({ where: { id }, data: { status: "canceled" }, include: liveRequestInclude });
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
    include: liveRequestInclude,
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
