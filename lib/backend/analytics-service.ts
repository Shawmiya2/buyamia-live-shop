import { dashboardRoleMap } from "./mock-data";
import { getLives } from "./live-service";
import {
  getFollowedProviders,
  getProviderFollowers,
  getViewerReplayFeed,
} from "./subscription-service";
import { readBackendStore } from "./store";
import type {
  DashboardType,
  MainAnalyticsSummary,
  ProviderAnalyticsSummary,
  ViewerAnalyticsSummary,
} from "./types";

export function getProviderAnalyticsSummary(
  dashboardType: Exclude<DashboardType, "main" | "viewer">,
): ProviderAnalyticsSummary {
  const store = readBackendStore();
  const role = dashboardRoleMap[dashboardType];
  const provider = store.providers.find((item) => item.profileType === role);
  const providerLives = getLives().filter(
    (live) => provider && live.providerId === provider.id,
  );
  const replayViews = providerLives.reduce((sum, live) => sum + live.replayViews, 0);
  const conversionIntent =
    providerLives.length > 0
      ? Math.round(
          providerLives.reduce((sum, live) => sum + live.conversionIntent, 0) /
            providerLives.length,
        )
      : 0;

  return {
    totalLives: providerLives.length,
    activeLives: providerLives.filter((live) => live.status === "live").length,
    replayViews,
    followers: provider ? getProviderFollowers(provider.id).length : 0,
    conversionIntent,
    verificationStatus: provider?.verificationStatus ?? "not_started",
  };
}

export function getViewerAnalyticsSummary(
  viewerUserId = "user_viewer_mock",
): ViewerAnalyticsSummary {
  const store = readBackendStore();
  const followedProviders = getFollowedProviders(viewerUserId);
  const followedLives = getLives().filter((live) =>
    followedProviders.some((provider) => provider.id === live.providerId),
  );

  return {
    followedProviders: followedProviders.length,
    upcomingLives: followedLives.filter((live) => live.status === "scheduled")
      .length,
    availableReplays: getViewerReplayFeed(viewerUserId).length,
    watchedLives: store.analyticsEvents.filter(
      (item) => item.type === "watched_live" && item.userId === viewerUserId,
    ).length,
  };
}

export function getMainAnalyticsSummary(): MainAnalyticsSummary {
  const store = readBackendStore();
  const allLives = getLives();

  return {
    totalUsers: store.users.length,
    totalProviders: store.providers.length,
    activeLives: allLives.filter((live) => live.status === "live").length,
    pinnedLives: allLives.filter((live) => live.isPinned).length,
    pendingVerifications: store.users.filter(
      (user) =>
        user.verificationStatus === "pending" ||
        user.verificationStatus === "needs_more_info",
    ).length,
    expiringReplays: allLives.filter(
      (live) => live.replay.status === "expiring_soon",
    ).length,
  };
}

export function getAnalyticsSummary(dashboardType: DashboardType, userId?: string | null) {
  if (dashboardType === "main") {
    return getMainAnalyticsSummary();
  }

  if (dashboardType === "viewer") {
    return getViewerAnalyticsSummary(userId ?? "user_viewer_mock");
  }

  return getProviderAnalyticsSummary(dashboardType);
}
