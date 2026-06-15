import { getLives, sortPinnedLives } from "./live-service";
import { createAnalyticsEvent, readBackendStore, updateBackendStore } from "./store";
import type { Subscription } from "./types";

export function followProvider(input: {
  viewerUserId?: unknown;
  viewerId?: unknown;
  providerId: unknown;
}) {
  const viewerUserId =
    typeof input.viewerUserId === "string" && input.viewerUserId.trim()
      ? input.viewerUserId
      : typeof (input as { viewerId?: unknown }).viewerId === "string" &&
          (input as { viewerId?: string }).viewerId?.trim()
        ? (input as { viewerId: string }).viewerId
        : "";

  if (!viewerUserId) {
    throw new Error("viewerUserId is required.");
  }

  if (typeof input.providerId !== "string" || !input.providerId.trim()) {
    throw new Error("providerId is required.");
  }
  const providerId = input.providerId.trim();

  return updateBackendStore((store) => {
    const provider = store.providers.find((item) => item.id === providerId);

    if (!provider) {
      throw new Error("Provider not found.");
    }

    const existing = store.subscriptions.find(
      (item) =>
        item.viewerUserId === viewerUserId &&
        item.providerId === providerId,
    );

    if (existing) {
      return existing;
    }

    const subscription: Subscription = {
      viewerUserId,
      providerId,
      followedAt: new Date().toISOString(),
    };

    store.subscriptions.push(subscription);
    store.analyticsEvents.push(
      createAnalyticsEvent({
        type: "followed_provider",
        userId: viewerUserId,
        providerId,
      }),
    );

    return subscription;
  });
}

export function unfollowProvider(input: {
  viewerUserId?: unknown;
  viewerId?: unknown;
  providerId: unknown;
}) {
  const viewerUserId =
    typeof input.viewerUserId === "string" && input.viewerUserId.trim()
      ? input.viewerUserId
      : typeof (input as { viewerId?: unknown }).viewerId === "string" &&
          (input as { viewerId?: string }).viewerId?.trim()
        ? (input as { viewerId: string }).viewerId
        : "";

  if (!viewerUserId) {
    throw new Error("viewerUserId is required.");
  }

  if (typeof input.providerId !== "string" || !input.providerId.trim()) {
    throw new Error("providerId is required.");
  }
  const providerId = input.providerId.trim();

  return updateBackendStore((store) => {
    const index = store.subscriptions.findIndex(
      (item) =>
        item.viewerUserId === viewerUserId &&
        item.providerId === providerId,
    );

    if (index >= 0) {
      store.subscriptions.splice(index, 1);
    }

    store.analyticsEvents.push(
      createAnalyticsEvent({
        type: "unfollowed_provider",
        userId: viewerUserId,
        providerId,
      }),
    );

    return { viewerUserId, providerId };
  });
}

export function getFollowedProviders(viewerUserId: string) {
  const store = readBackendStore();
  const followedProviderIds = store.subscriptions
    .filter((item) => item.viewerUserId === viewerUserId)
    .map((item) => item.providerId);

  return store.providers.filter((provider) => followedProviderIds.includes(provider.id));
}

export function getProviderFollowers(providerId: string) {
  return readBackendStore().subscriptions.filter(
    (item) => item.providerId === providerId,
  );
}

export function getViewerReplayFeed(viewerUserId: string) {
  const followedProviderIds = getFollowedProviders(viewerUserId).map(
    (provider) => provider.id,
  );

  return sortPinnedLives(
    getLives().filter(
      (live) =>
        followedProviderIds.includes(live.providerId) &&
        live.status === "replay" &&
        live.replay.status !== "expired",
    ),
  );
}

export function getAvailableProvidersForViewer(viewerUserId: string) {
  const store = readBackendStore();
  const followedIds = new Set(
    store.subscriptions
      .filter((item) => item.viewerUserId === viewerUserId)
      .map((item) => item.providerId),
  );

  return store.providers.filter((provider) => !followedIds.has(provider.id));
}

export function getViewerUpcomingLives(viewerUserId: string) {
  const followedProviderIds = getFollowedProviders(viewerUserId).map(
    (provider) => provider.id,
  );

  return sortPinnedLives(
    getLives().filter(
      (live) =>
        followedProviderIds.includes(live.providerId) &&
        live.status === "scheduled",
    ),
  );
}
