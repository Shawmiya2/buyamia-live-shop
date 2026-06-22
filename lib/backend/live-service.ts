import type { Live, Prisma, ProviderProfile, User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";
import { datePlusDays, defaultReplayAvailabilityDays, getReplayStatus } from "./replay-policy";
import type { LiveEvent, LiveListResponse, PinReason, ReplayStatus } from "./types";

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

const liveStatuses = ["scheduled", "active", "completed", "replay", "expired"] as const;
const providerRoles = ["hotel", "restaurant", "supplier", "service_provider"] as const;
const pinReasons = ["sponsored", "nearby", "most_watched", "featured_by_buyamia"] as const;
const replayStatuses = ["active", "expiring_soon", "expired"] as const;
const sortOptions = ["important", "scheduled_desc", "scheduled_asc", "title_asc", "provider_asc", "replay_expiring"] as const;

type LiveListStatus = (typeof liveStatuses)[number];
type ProviderRoleFilter = (typeof providerRoles)[number];
type SortOption = (typeof sortOptions)[number];

export type ListLivesInput = {
  page?: unknown;
  pageSize?: unknown;
  search?: unknown;
  status?: unknown;
  category?: unknown;
  providerRole?: unknown;
  providerId?: unknown;
  pinned?: unknown;
  pinReason?: unknown;
  replayStatus?: unknown;
  sort?: unknown;
};

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalString(value: unknown) {
  const current = firstValue(value);
  if (typeof current === "number" && Number.isFinite(current)) {
    return String(current);
  }
  return typeof current === "string" && current.trim() ? current.trim() : undefined;
}

function numberParam(value: unknown, fallback: number, max?: number) {
  const current = Number(optionalString(value));
  const next = Number.isFinite(current) && current > 0 ? Math.floor(current) : fallback;
  return max ? Math.min(next, max) : next;
}

function enumParam<T extends readonly string[]>(value: unknown, options: T): T[number] | undefined {
  const current = optionalString(value);
  return current && options.includes(current) ? current : undefined;
}

function replayWhere(status: ReplayStatus, now: Date): Prisma.LiveWhereInput {
  if (status === "expired") {
    return { OR: [{ replayExpiresAt: null }, { replayExpiresAt: { lte: now } }] };
  }

  if (status === "expiring_soon") {
    return { replayExpiresAt: { gt: now, lte: datePlusDays(now, 2) } };
  }

  return { replayExpiresAt: { gt: datePlusDays(now, 2) } };
}

function statusWhere(status: LiveListStatus, now: Date): Prisma.LiveWhereInput {
  if (status === "replay") {
    return { status: "completed", replayExpiresAt: { gt: now } };
  }

  if (status === "expired") {
    return { status: "completed", OR: [{ replayExpiresAt: null }, { replayExpiresAt: { lte: now } }] };
  }

  return { status };
}

function activePinWhere(now: Date): Prisma.LiveWhereInput {
  return { isPinned: true, OR: [{ pinExpiresAt: null }, { pinExpiresAt: { gt: now } }] };
}

function inactivePinWhere(now: Date): Prisma.LiveWhereInput {
  return {
    OR: [
      { isPinned: false },
      { isPinned: true, pinExpiresAt: { lte: now } },
    ],
  };
}

function orderByForSort(sort: SortOption): Prisma.LiveOrderByWithRelationInput[] {
  if (sort === "scheduled_asc") {
    return [{ scheduledAt: "asc" }, { createdAt: "asc" }];
  }
  if (sort === "title_asc") {
    return [{ title: "asc" }, { scheduledAt: "desc" }];
  }
  if (sort === "provider_asc") {
    return [{ provider: { displayName: "asc" } }, { scheduledAt: "desc" }];
  }
  if (sort === "replay_expiring") {
    return [{ replayExpiresAt: "asc" }, { scheduledAt: "desc" }];
  }
  if (sort === "scheduled_desc") {
    return [{ scheduledAt: "desc" }, { createdAt: "desc" }];
  }

  return [{ isPinned: "desc" }, { priorityScore: "desc" }, { scheduledAt: "desc" }, { createdAt: "desc" }];
}

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

async function toLiveEventWithMetrics(live: LiveWithProvider): Promise<LiveEvent> {
  const [viewerCount, replayViews, intentCount] = await Promise.all([
    prisma.analyticsEvent.count({ where: { liveId: live.id, eventType: { in: ["live_viewed", "watched_live"] } } }),
    prisma.analyticsEvent.count({ where: { liveId: live.id, eventType: "replay_viewed" } }),
    prisma.analyticsEvent.count({ where: { liveId: live.id, eventType: { contains: "intent" } } }),
  ]);
  const event = toLiveEvent(live);

  return {
    ...event,
    viewerCount,
    replayViews,
    conversionIntent: viewerCount > 0 ? Math.min(100, Math.round((intentCount / viewerCount) * 100)) : 0,
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

export async function getLiveDetailsById(id: string) {
  const live = await prisma.live.findUnique({
    where: { id },
    include: { provider: { include: { user: true } } },
  });

  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  return toLiveEventWithMetrics(live);
}

export async function getPinnedLives(providerId?: string) {
  return (await getLives(providerId)).filter((live) => live.isPinned);
}

export async function listLives(input: ListLivesInput = {}): Promise<LiveListResponse> {
  const now = new Date();
  const page = numberParam(input.page, 1);
  const pageSize = numberParam(input.pageSize, 10, 50);
  const search = optionalString(input.search);
  const status = enumParam(input.status, liveStatuses);
  const providerRole = enumParam(input.providerRole, providerRoles);
  const pinReason = enumParam(input.pinReason, pinReasons) as PinReason | undefined;
  const replayStatus = enumParam(input.replayStatus, replayStatuses) as ReplayStatus | undefined;
  const sort = enumParam(input.sort, sortOptions) ?? "important";
  const category = optionalString(input.category);
  const providerId = optionalString(input.providerId);
  const pinned = optionalString(input.pinned);
  const whereParts: Prisma.LiveWhereInput[] = [];

  if (search) {
    whereParts.push({
      OR: [
        { title: { contains: search } },
        { provider: { displayName: { contains: search } } },
        { provider: { user: { name: { contains: search } } } },
      ],
    });
  }
  if (status) {
    whereParts.push(statusWhere(status, now));
  }
  if (category) {
    whereParts.push({ category });
  }
  if (providerRole) {
    whereParts.push({ provider: { category: providerRole } });
  }
  if (providerId) {
    whereParts.push({ providerId });
  }
  if (pinned === "pinned" || pinned === "true") {
    whereParts.push(activePinWhere(now));
  }
  if (pinned === "not_pinned" || pinned === "false") {
    whereParts.push(inactivePinWhere(now));
  }
  if (pinReason) {
    whereParts.push({ pinReason });
  }
  if (replayStatus) {
    whereParts.push(replayWhere(replayStatus, now));
  }

  const where: Prisma.LiveWhereInput = whereParts.length ? { AND: whereParts } : {};
  const [totalItems, activePinnedCount, lives] = await Promise.all([
    prisma.live.count({ where }),
    prisma.live.count({ where: activePinWhere(now) }),
    prisma.live.findMany({
      where,
      include: { provider: { include: { user: true } } },
      orderBy: orderByForSort(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: await Promise.all(lives.map(toLiveEventWithMetrics)),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
    activePinnedCount,
  };
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
