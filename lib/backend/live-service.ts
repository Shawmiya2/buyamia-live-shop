import type { Live, ProviderProfile, User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";
import { datePlusDays, defaultReplayAvailabilityDays, getReplayStatus } from "./replay-policy";
import type { LiveEvent } from "./types";

const pinSchema = z.object({
  isPinned: z.boolean(),
  pinReason: z.enum(["sponsored", "nearby", "most_watched", "featured_by_buyamia"]).optional(),
  pinExpiresAt: z.string().datetime().optional(),
  priorityScore: z.number().int().min(0).max(1000).optional(),
});

const replaySchema = z.object({
  extensionDays: z.number().int().positive().max(365).default(5),
});

type LiveWithProvider = Live & {
  provider: ProviderProfile & { user: User };
};

export function isPinActive(live: Pick<Live, "isPinned" | "pinExpiresAt">, now = new Date()) {
  return live.isPinned && (!live.pinExpiresAt || live.pinExpiresAt > now);
}

export function toLiveEvent(live: LiveWithProvider): LiveEvent {
  const replay = getReplayStatus(live.replayExpiresAt);

  return {
    id: live.id,
    providerId: live.providerId,
    providerName: live.provider.displayName,
    providerRole: live.provider.category as LiveEvent["providerRole"],
    title: live.title,
    category: live.category,
    status:
      live.status === "active"
        ? "live"
        : live.status === "completed"
          ? "replay"
          : "scheduled",
    startsAt: (live.scheduledAt ?? live.startedAt ?? live.createdAt).toISOString(),
    viewerCount: 0,
    replayViews: 0,
    conversionIntent: 0,
    isPinned: isPinActive(live),
    pinReason: live.pinReason ?? undefined,
    pinExpiresAt: live.pinExpiresAt?.toISOString(),
    priorityScore: live.priorityScore,
    replay: {
      availableFrom: (live.endedAt ?? live.createdAt).toISOString(),
      expiresAt: live.replayExpiresAt?.toISOString() ?? "",
      daysRemaining: replay.daysRemaining,
      status: replay.status,
      extensionAvailable: true,
      extensionDays: defaultReplayAvailabilityDays,
      planLabel: "Replay extension",
      priceLabel: "Payment placeholder: not connected",
    },
  };
}

export function sortPinnedLives(input: LiveEvent[]) {
  return [...input].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return Number(b.isPinned) - Number(a.isPinned);
    }
    return b.priorityScore - a.priorityScore;
  });
}

export async function getLives(providerId?: string) {
  const lives = await prisma.live.findMany({
    where: providerId ? { providerId } : undefined,
    include: { provider: { include: { user: true } } },
  });

  return sortPinnedLives(lives.map(toLiveEvent));
}

export async function getLiveById(id: string) {
  const live = await prisma.live.findUnique({
    where: { id },
    include: { provider: { include: { user: true } } },
  });

  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  return toLiveEvent(live);
}

export async function getPinnedLives(providerId?: string) {
  return (await getLives(providerId)).filter((live) => live.isPinned);
}

export async function extendReplayAvailability(input: {
  liveId: string;
  extensionDays?: unknown;
  adminId?: string;
}) {
  const parsed = replaySchema.parse(input);
  const live = await prisma.live.findUnique({ where: { id: input.liveId } });
  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  const baseDate =
    live.replayExpiresAt && live.replayExpiresAt > new Date()
      ? live.replayExpiresAt
      : new Date();
  const updated = await prisma.live.update({
    where: { id: input.liveId },
    data: { replayExpiresAt: datePlusDays(baseDate, parsed.extensionDays) },
    include: { provider: { include: { user: true } } },
  });

  await createAnalyticsEvent({
    providerId: updated.providerId,
    liveId: updated.id,
    eventType: "replay_extended",
    metadata: { extensionDays: parsed.extensionDays },
  });

  if (input.adminId) {
    await prisma.adminActivity.create({
      data: {
        adminId: input.adminId,
        action: "replay_extended",
        targetType: "live",
        targetId: updated.id,
        message: `Extended replay by ${parsed.extensionDays} days.`,
      },
    });
  }

  return toLiveEvent(updated);
}

export async function updateLivePin(input: {
  liveId: string;
  isPinned: unknown;
  pinReason?: unknown;
  pinExpiresAt?: unknown;
  priorityScore?: unknown;
  adminId?: string;
}) {
  const parsed = pinSchema.parse(input);
  const live = await prisma.live.findUnique({ where: { id: input.liveId } });
  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  const updated = await prisma.live.update({
    where: { id: input.liveId },
    data: parsed.isPinned
      ? {
          isPinned: true,
          pinReason: parsed.pinReason ?? "featured_by_buyamia",
          pinExpiresAt: parsed.pinExpiresAt ? new Date(parsed.pinExpiresAt) : datePlusDays(new Date(), 5),
          priorityScore: parsed.priorityScore ?? Math.max(live.priorityScore, 100),
        }
      : {
          isPinned: false,
          pinReason: null,
          pinExpiresAt: null,
          priorityScore: 0,
        },
    include: { provider: { include: { user: true } } },
  });

  await createAnalyticsEvent({
    providerId: updated.providerId,
    liveId: updated.id,
    eventType: parsed.isPinned ? "live_pinned" : "live_unpinned",
    metadata: parsed.pinReason ? { pinReason: parsed.pinReason } : undefined,
  });

  if (input.adminId) {
    await prisma.adminActivity.create({
      data: {
        adminId: input.adminId,
        action: parsed.isPinned ? "live_pinned" : "live_unpinned",
        targetType: "live",
        targetId: updated.id,
        message: parsed.isPinned ? "Pinned live." : "Unpinned live.",
      },
    });
  }

  return toLiveEvent(updated);
}
