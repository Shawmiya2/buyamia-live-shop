import { providers, subscriptions } from "./mock-data";
import { getLives, sortPinnedLives } from "./live-service";
import type { Subscription } from "./types";

export function followProvider(input: { viewerUserId: unknown; providerId: unknown }) {
  if (typeof input.viewerUserId !== "string" || !input.viewerUserId.trim()) {
    throw new Error("viewerUserId is required.");
  }

  if (typeof input.providerId !== "string" || !input.providerId.trim()) {
    throw new Error("providerId is required.");
  }

  const provider = providers.find((item) => item.id === input.providerId);

  if (!provider) {
    throw new Error("Provider not found.");
  }

  const existing = subscriptions.find(
    (item) =>
      item.viewerUserId === input.viewerUserId &&
      item.providerId === input.providerId,
  );

  if (existing) {
    return existing;
  }

  const subscription: Subscription = {
    viewerUserId: input.viewerUserId,
    providerId: input.providerId,
    followedAt: new Date().toISOString(),
  };

  subscriptions.push(subscription);

  return subscription;
}

export function unfollowProvider(input: {
  viewerUserId: unknown;
  providerId: unknown;
}) {
  if (typeof input.viewerUserId !== "string" || !input.viewerUserId.trim()) {
    throw new Error("viewerUserId is required.");
  }

  if (typeof input.providerId !== "string" || !input.providerId.trim()) {
    throw new Error("providerId is required.");
  }

  const index = subscriptions.findIndex(
    (item) =>
      item.viewerUserId === input.viewerUserId &&
      item.providerId === input.providerId,
  );

  if (index >= 0) {
    subscriptions.splice(index, 1);
  }

  return { viewerUserId: input.viewerUserId, providerId: input.providerId };
}

export function getFollowedProviders(viewerUserId: string) {
  const followedProviderIds = subscriptions
    .filter((item) => item.viewerUserId === viewerUserId)
    .map((item) => item.providerId);

  return providers.filter((provider) => followedProviderIds.includes(provider.id));
}

export function getProviderFollowers(providerId: string) {
  return subscriptions.filter((item) => item.providerId === providerId);
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
