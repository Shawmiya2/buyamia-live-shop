import type {
  LivePresenterTool,
  LivePresenterToolType,
  LiveToolActivationStatus,
  LiveToolTriggerReason,
  Prisma,
} from "@prisma/client";
import { z } from "zod";
import { assertProviderOwner } from "./auth-context";
import { ApiError, ValidationApiError } from "./errors";
import { prisma } from "./prisma";
import { fieldErrorsFromZod } from "./validation";
import type { SafeUser } from "./types";
import { getSignalCounts } from "./live-signal-service";

export const presenterToolTypes = [
  "product_card",
  "limited_offer",
  "countdown",
  "poll",
  "question_spotlight",
  "applause_burst",
  "trust_badge",
  "concierge_prompt",
  "ambassador_challenge",
  "review_request",
] as const;

const triggerReasons = [
  "manual",
  "viewer_question",
  "purchase_intent",
  "follow",
  "high_engagement",
  "checkout_interest",
] as const;

const activationStatuses = ["active", "dismissed", "expired"] as const;

const triggerSchema = z.object({
  toolType: z.enum(presenterToolTypes),
  triggerReason: z.enum(triggerReasons).default("manual"),
  payload: z.record(z.string(), z.unknown()).default({}),
  expiresAt: z.string().datetime().optional(),
});

const updateActivationSchema = z.object({
  status: z.enum(activationStatuses),
});

export type PresenterToolSuggestion = {
  toolType: LivePresenterToolType;
  reason: string;
};

export type AvailablePresenterTool = LivePresenterTool;

export type PresenterToolActivationWithPresenter = Prisma.LiveToolActivationGetPayload<{
  include: { presenter: { select: { id: true; name: true; role: true } } };
}>;

export async function listAvailablePresenterTools(): Promise<AvailablePresenterTool[]> {
  return prisma.livePresenterTool.findMany({ orderBy: { name: "asc" } });
}

export async function assertCanManageLiveTools(user: SafeUser, liveId: string) {
  const live = await prisma.live.findUnique({
    where: { id: liveId },
    select: { id: true, providerId: true },
  });

  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  assertProviderOwner(user, live.providerId);
  return live;
}

export async function triggerPresenterTool(input: {
  liveId: string;
  presenter: SafeUser;
  data: unknown;
}) {
  const parsed = triggerSchema.safeParse(input.data);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  await assertCanManageLiveTools(input.presenter, input.liveId);

  const tool = await prisma.livePresenterTool.findUnique({
    where: { type: parsed.data.toolType },
  });
  if (!tool) {
    throw new ApiError("not_found", "Presenter tool not found.", 404);
  }

  const payload = {
    ...(isPlainObject(tool.defaultPayload) ? tool.defaultPayload : {}),
    ...parsed.data.payload,
  } as Prisma.InputJsonObject;

  return prisma.liveToolActivation.create({
    data: {
      liveId: input.liveId,
      presenterId: input.presenter.id,
      toolType: parsed.data.toolType,
      triggerReason: parsed.data.triggerReason as LiveToolTriggerReason,
      payload,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
    include: { presenter: { select: { id: true, name: true, role: true } } },
  });
}

export async function listActiveToolsForLive(
  liveId: string,
): Promise<PresenterToolActivationWithPresenter[]> {
  await expirePastActivations(liveId);
  return prisma.liveToolActivation.findMany({
    where: { liveId, status: "active" },
    orderBy: { createdAt: "desc" },
    include: { presenter: { select: { id: true, name: true, role: true } } },
  });
}

export async function listRecentToolActivations(
  liveId: string,
  limit = 12,
): Promise<PresenterToolActivationWithPresenter[]> {
  await expirePastActivations(liveId);
  return prisma.liveToolActivation.findMany({
    where: { liveId },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 50)),
    include: { presenter: { select: { id: true, name: true, role: true } } },
  });
}

export async function updateToolActivation(input: {
  liveId: string;
  activationId: string;
  user: SafeUser;
  data: unknown;
}) {
  const parsed = updateActivationSchema.safeParse(input.data);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  await assertCanManageLiveTools(input.user, input.liveId);
  const activation = await prisma.liveToolActivation.findFirst({
    where: { id: input.activationId, liveId: input.liveId },
  });
  if (!activation) {
    throw new ApiError("not_found", "Tool activation not found.", 404);
  }

  return prisma.liveToolActivation.update({
    where: { id: input.activationId },
    data: { status: parsed.data.status as LiveToolActivationStatus },
    include: { presenter: { select: { id: true, name: true, role: true } } },
  });
}

export async function computeSuggestedTools(liveId: string): Promise<PresenterToolSuggestion[]> {
  const counts = await getSignalCounts(liveId);
  const suggestions: PresenterToolSuggestion[] = [];

  if ((counts.question ?? 0) > 0) {
    suggestions.push({ toolType: "question_spotlight", reason: "Viewer questions are waiting for a presenter response." });
  }
  if ((counts.purchase_intent ?? 0) > 0 || (counts.checkout_click ?? 0) > 0) {
    suggestions.push({ toolType: "product_card", reason: "Viewers are showing purchase or checkout interest." });
    suggestions.push({ toolType: "limited_offer", reason: "A limited offer can focus active purchase intent." });
  }
  if ((counts.follow ?? 0) > 0) {
    suggestions.push({ toolType: "applause_burst", reason: "Followers joined during this live." });
    suggestions.push({ toolType: "ambassador_challenge", reason: "Follow activity is a good moment to invite sharing." });
  }
  if ((counts.concierge_request ?? 0) > 0) {
    suggestions.push({ toolType: "concierge_prompt", reason: "Viewers requested booking, delivery, or service help." });
  }
  if ((counts.replay_view ?? 0) > 0) {
    suggestions.push({ toolType: "trust_badge", reason: "Replay viewers may need verification confidence." });
  }

  return suggestions;
}

async function expirePastActivations(liveId: string) {
  await prisma.liveToolActivation.updateMany({
    where: {
      liveId,
      status: "active",
      expiresAt: { not: null, lte: new Date() },
    },
    data: { status: "expired" },
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
