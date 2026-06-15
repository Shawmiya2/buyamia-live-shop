import { calculateReplayStatus, datePlusDays } from "./replay-policy";
import { createAnalyticsEvent, readBackendStore, updateBackendStore } from "./store";
import type { LiveEvent, PinReason } from "./types";

const pinReasons: PinReason[] = [
  "sponsored",
  "nearby",
  "most_watched",
  "featured_by_buyamia",
];

export { calculateReplayStatus };

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
  return sortPinnedLives(
    readBackendStore().lives.map((live) => hydrateReplayStatus(live)),
  );
}

export function getLiveById(id: string) {
  const live = readBackendStore().lives.find((item) => item.id === id);

  if (!live) {
    throw new Error("Live not found.");
  }

  return hydrateReplayStatus(live);
}

export function sortPinnedLives(input: LiveEvent[]) {
  return [...input].sort((a, b) => {
    const aPinned = isPinActive(a);
    const bPinned = isPinActive(b);

    if (aPinned !== bPinned) {
      return Number(bPinned) - Number(aPinned);
    }

    return b.priorityScore - a.priorityScore;
  });
}

export function getPinnedLives(providerId?: string) {
  return sortPinnedLives(
    getLives().filter((live) => {
      const providerMatches = providerId ? live.providerId === providerId : true;
      return isPinActive(live) && providerMatches;
    }),
  );
}

function isPinActive(live: LiveEvent) {
  if (!live.isPinned) {
    return false;
  }

  if (!live.pinExpiresAt) {
    return true;
  }

  return new Date(live.pinExpiresAt).getTime() > Date.now();
}

export function extendReplayAvailability(input: {
  liveId: string;
  extensionDays?: unknown;
  planLabel?: unknown;
  priceLabel?: unknown;
}) {
  return updateBackendStore((store) => {
    const live = store.lives.find((item) => item.id === input.liveId);

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
    live.replay.extensionDays = extensionDays;
    live.replay.planLabel =
      typeof input.planLabel === "string" && input.planLabel.trim()
        ? input.planLabel.trim()
        : "Extended demo replay";
    live.replay.priceLabel =
      typeof input.priceLabel === "string" && input.priceLabel.trim()
        ? input.priceLabel.trim()
        : "Payment placeholder: not connected";

    store.analyticsEvents.push(
      createAnalyticsEvent({
        type: "replay_extended",
        providerId: live.providerId,
        liveId: live.id,
        metadata: { extensionDays },
      }),
    );

    return hydrateReplayStatus(live);
  });
}

export function updateLivePin(input: {
  liveId: string;
  isPinned: unknown;
  pinReason?: unknown;
  pinExpiresAt?: unknown;
  priorityScore?: unknown;
}) {
  return updateBackendStore((store) => {
    const live = store.lives.find((item) => item.id === input.liveId);

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
    } else if (live.isPinned && !live.pinExpiresAt) {
      live.pinExpiresAt = datePlusDays(new Date(), 5).toISOString();
    }

    if (typeof input.priorityScore === "number") {
      live.priorityScore = input.priorityScore;
    } else if (live.isPinned) {
      live.priorityScore = Math.max(live.priorityScore, 100);
    }

    if (!live.isPinned) {
      live.pinReason = undefined;
      live.pinExpiresAt = undefined;
    }

    store.analyticsEvents.push(
      createAnalyticsEvent({
        type: live.isPinned ? "live_pinned" : "live_unpinned",
        providerId: live.providerId,
        liveId: live.id,
        metadata: live.pinReason ? { pinReason: live.pinReason } : undefined,
      }),
    );

    return hydrateReplayStatus(live);
  });
}
