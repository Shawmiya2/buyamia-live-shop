import { lives } from "./mock-data";
import type { LiveEvent, PinReason, ReplayStatus } from "./types";

const pinReasons: PinReason[] = [
  "sponsored",
  "nearby",
  "most_watched",
  "featured_by_buyamia",
];

function datePlusDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function calculateReplayStatus(expiresAt: string, now = new Date()) {
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / 86_400_000));
  let status: ReplayStatus = "active";

  if (daysRemaining <= 0) {
    status = "expired";
  } else if (daysRemaining <= 2) {
    status = "expiring_soon";
  }

  return { daysRemaining, status };
}

export function hydrateReplayStatus(live: LiveEvent, now = new Date()): LiveEvent {
  return {
    ...live,
    replay: {
      ...live.replay,
      ...calculateReplayStatus(live.replay.expiresAt, now),
    },
  };
}

export function getLives() {
  return sortPinnedLives(lives.map((live) => hydrateReplayStatus(live)));
}

export function getLiveById(id: string) {
  const live = lives.find((item) => item.id === id);

  if (!live) {
    throw new Error("Live not found.");
  }

  return hydrateReplayStatus(live);
}

export function sortPinnedLives(input: LiveEvent[]) {
  return [...input].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return Number(b.isPinned) - Number(a.isPinned);
    }

    return b.priorityScore - a.priorityScore;
  });
}

export function getPinnedLives(providerId?: string) {
  return sortPinnedLives(
    getLives().filter((live) => {
      const providerMatches = providerId ? live.providerId === providerId : true;
      return live.isPinned && providerMatches;
    }),
  );
}

export function extendReplayAvailability(input: {
  liveId: string;
  extensionDays?: unknown;
  planLabel?: unknown;
  priceLabel?: unknown;
}) {
  const live = lives.find((item) => item.id === input.liveId);

  if (!live) {
    throw new Error("Live not found.");
  }

  const extensionDays =
    typeof input.extensionDays === "number" && input.extensionDays > 0
      ? Math.ceil(input.extensionDays)
      : live.replay.extensionDays;
  const currentExpiresAt = new Date(live.replay.expiresAt);
  const baseDate =
    currentExpiresAt.getTime() > Date.now() ? currentExpiresAt : new Date();
  const nextExpiresAt = datePlusDays(baseDate, extensionDays).toISOString();

  live.replay.expiresAt = nextExpiresAt;
  live.replay.planLabel =
    typeof input.planLabel === "string" && input.planLabel.trim()
      ? input.planLabel.trim()
      : live.replay.planLabel;
  live.replay.priceLabel =
    typeof input.priceLabel === "string" && input.priceLabel.trim()
      ? input.priceLabel.trim()
      : live.replay.priceLabel;

  return hydrateReplayStatus(live);
}

export function updateLivePin(input: {
  liveId: string;
  isPinned: unknown;
  pinReason?: unknown;
  pinExpiresAt?: unknown;
  priorityScore?: unknown;
}) {
  const live = lives.find((item) => item.id === input.liveId);

  if (!live) {
    throw new Error("Live not found.");
  }

  if (typeof input.isPinned !== "boolean") {
    throw new Error("isPinned must be a boolean.");
  }

  live.isPinned = input.isPinned;

  if (input.pinReason !== undefined) {
    if (
      typeof input.pinReason !== "string" ||
      !pinReasons.includes(input.pinReason as PinReason)
    ) {
      throw new Error("Invalid pin reason.");
    }

    live.pinReason = input.pinReason as PinReason;
  }

  if (typeof input.pinExpiresAt === "string" && input.pinExpiresAt.trim()) {
    live.pinExpiresAt = new Date(input.pinExpiresAt).toISOString();
  }

  if (typeof input.priorityScore === "number") {
    live.priorityScore = input.priorityScore;
  }

  if (!live.isPinned) {
    live.pinReason = undefined;
    live.pinExpiresAt = undefined;
  }

  return hydrateReplayStatus(live);
}
