import type { PinnedPlacementContentType, PinnedPlacementRequestStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";

const contentTypes = ["service", "live_stream", "replay"] as const;
const requestStatuses = ["draft", "submitted", "under_review", "approved", "rejected", "published", "expired"] as const;

const pinnedPlacementSchema = z
  .object({
    contentType: z.enum(contentTypes, "Please select a valid content type."),
    contentId: z.string().trim().min(1, "Please select content to promote."),
    promotionTitle: z.string().trim().min(1, "Please enter a promotion title."),
    reason: z.string().trim().min(10, "Please explain why this placement should be featured."),
    promotionPeriod: z.string().trim().min(1, "Please enter the preferred promotion period."),
    preferredStartDate: z.string().trim().min(1, "Please select a start date."),
    preferredEndDate: z.string().trim().min(1, "Please select an end date."),
    targetAudience: z.string().trim().min(1, "Please enter a target audience."),
    additionalNotes: z.string().trim().optional(),
    status: z.enum(requestStatuses).default("submitted"),
  })
  .superRefine((value, context) => {
    const startDate = new Date(`${value.preferredStartDate}T00:00:00`);
    const endDate = new Date(`${value.preferredEndDate}T23:59:59`);
    if (Number.isNaN(startDate.getTime())) {
      context.addIssue({ code: "custom", path: ["preferredStartDate"], message: "Please select a valid start date." });
    }
    if (Number.isNaN(endDate.getTime())) {
      context.addIssue({ code: "custom", path: ["preferredEndDate"], message: "Please select a valid end date." });
    }
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
      context.addIssue({ code: "custom", path: ["preferredEndDate"], message: "End date must be after start date." });
    }
  });

async function assertServiceProvider(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Service provider not found.", 404);
  }
  if (provider.category !== "service_provider") {
    throw new ApiError("forbidden", "Only service providers can request pinned placement.", 403);
  }
  return provider;
}

async function assertOwnedContent(providerId: string, contentType: PinnedPlacementContentType, contentId: string) {
  if (contentType === "service") {
    if (contentId !== providerId) {
      throw new ApiError("forbidden", "You can only promote your own service profile.", 403);
    }
    return;
  }

  const live = await prisma.live.findFirst({
    where: {
      id: contentId,
      providerId,
      status: contentType === "replay" ? "completed" : { in: ["scheduled", "active"] },
    },
    select: { id: true },
  });
  if (!live) {
    throw new ApiError("not_found", "Selected content was not found for this service provider.", 404);
  }
}

export async function getPinnedPlacementOptions(providerId: string) {
  const provider = await assertServiceProvider(providerId);
  const lives = await prisma.live.findMany({
    where: { providerId, status: { in: ["scheduled", "active"] } },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, category: true, status: true, scheduledAt: true },
  });
  const replays = await prisma.live.findMany({
    where: { providerId, status: "completed" },
    orderBy: [{ endedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, category: true, status: true, endedAt: true },
  });

  return {
    service: { id: provider.id, title: provider.displayName, category: "Service profile" },
    liveStreams: lives,
    replays,
  };
}

export async function createPinnedPlacementRequest(providerId: string, input: unknown) {
  await assertServiceProvider(providerId);
  const parsed = pinnedPlacementSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }
  await assertOwnedContent(providerId, parsed.data.contentType as PinnedPlacementContentType, parsed.data.contentId);

  const status = parsed.data.status as PinnedPlacementRequestStatus;
  return prisma.pinnedPlacementRequest.create({
    data: {
      providerId,
      contentType: parsed.data.contentType as PinnedPlacementContentType,
      contentId: parsed.data.contentId,
      promotionTitle: parsed.data.promotionTitle,
      reason: parsed.data.reason,
      promotionPeriod: parsed.data.promotionPeriod,
      preferredStartDate: new Date(`${parsed.data.preferredStartDate}T00:00:00`),
      preferredEndDate: new Date(`${parsed.data.preferredEndDate}T23:59:59`),
      targetAudience: parsed.data.targetAudience,
      additionalNotes: parsed.data.additionalNotes || null,
      status,
      submittedAt: status === "submitted" ? new Date() : null,
      expiresAt: new Date(`${parsed.data.preferredEndDate}T23:59:59`),
    },
    include: { provider: { select: { displayName: true, category: true } } },
  });
}

export async function listPinnedPlacementRequests(providerId?: string) {
  return prisma.pinnedPlacementRequest.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
    include: { provider: { select: { displayName: true, category: true } } },
  });
}
