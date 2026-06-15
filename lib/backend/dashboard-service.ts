import { dashboardRoleMap } from "./mock-data";
import { getAnalyticsSummary } from "./analytics-service";
import { getLives, getPinnedLives } from "./live-service";
import { getServiceLiveSetupRequests } from "./service-request-service";
import {
  getAvailableProvidersForViewer,
  getFollowedProviders,
  getProviderFollowers,
  getViewerReplayFeed,
  getViewerUpcomingLives,
} from "./subscription-service";
import { readBackendStore } from "./store";
import type { DashboardResponse, DashboardType } from "./types";
import type { DemoAccessContext } from "./demo-request";

export const dashboardTypes: DashboardType[] = [
  "main",
  "hotel",
  "restaurant",
  "supplier",
  "services",
  "viewer",
];

export function isDashboardType(value: unknown): value is DashboardType {
  return (
    typeof value === "string" && dashboardTypes.includes(value as DashboardType)
  );
}

function getNextActions(dashboardType: DashboardType) {
  const actions: Record<DashboardType, string[]> = {
    main: [
      "Review pending verifications",
      "Check expiring replay windows",
      "Audit pinned live priority",
    ],
    hotel: [
      "Review room verification status",
      "Extend high-converting replays",
      "Schedule next room walkthrough",
    ],
    restaurant: [
      "Review pending dining proof",
      "Pin the next chef stream",
      "Check replay conversion intent",
    ],
    supplier: [
      "Review supplier verification badge",
      "Prepare RFQ follow-up",
      "Extend factory replay availability",
    ],
    services: [
      "Submit missing service metadata",
      "Review service replay expiration",
      "Pin nearby provider live",
    ],
    viewer: [
      "Open followed provider replay feed",
      "Follow another verified provider",
      "Review upcoming lives",
    ],
  };

  return actions[dashboardType];
}

export function getDashboardData(
  dashboardType: DashboardType,
  accessContext?: DemoAccessContext,
): DashboardResponse {
  const store = readBackendStore();
  const role = dashboardRoleMap[dashboardType];
  const requestedUser = accessContext?.currentUserId
    ? store.users.find((item) => item.id === accessContext.currentUserId)
    : undefined;
  const providerFromSession = requestedUser?.providerId
    ? store.providers.find((item) => item.id === requestedUser.providerId)
    : undefined;
  const provider =
    dashboardType === "main" || dashboardType === "viewer"
      ? undefined
      : providerFromSession ??
        store.providers.find((item) => item.profileType === role);
  const user = provider
    ? store.users.find((item) => item.id === provider.ownerUserId)
    : requestedUser ?? store.users.find((item) => item.profileType === role);
  const allLives = getLives();
  const scopedLives =
    dashboardType === "main" || dashboardType === "viewer"
      ? allLives
      : allLives.filter((live) => live.providerId === provider?.id);
  const pinnedLives =
    dashboardType === "main" || dashboardType === "viewer"
      ? getPinnedLives()
      : getPinnedLives(provider?.id);
  const replayStats = {
    replayViews: scopedLives.reduce((sum, live) => sum + live.replayViews, 0),
    availableReplays: scopedLives.filter(
      (live) => live.status === "replay" && live.replay.status !== "expired",
    ).length,
    expiringReplays: scopedLives.filter(
      (live) => live.replay.status === "expiring_soon",
    ).length,
  };

  const response: DashboardResponse = {
    dashboardType,
    role,
    auth: accessContext,
    currentUserId: user?.id,
    providerId: provider?.id,
    verificationStatus:
      provider?.verificationStatus ?? user?.verificationStatus ?? "not_started",
    liveStats: {
      totalLives: scopedLives.length,
      activeLives: scopedLives.filter((live) => live.status === "live").length,
      scheduledLives: scopedLives.filter((live) => live.status === "scheduled")
        .length,
    },
    replayStats,
    liveCatalog: scopedLives,
    pinnedLives,
    analyticsSummary: getAnalyticsSummary(dashboardType, user?.id),
    nextActions: getNextActions(dashboardType),
  };

  if (dashboardType === "viewer") {
    const viewerUserId = user?.id ?? "user_viewer_mock";
    response.subscriptions = {
      followedProviders: getFollowedProviders(viewerUserId),
      replayFeed: getViewerReplayFeed(viewerUserId),
      upcomingLives: getViewerUpcomingLives(viewerUserId),
      availableProviders: getAvailableProvidersForViewer(viewerUserId),
    };
  }

  if (provider) {
    response.subscriptions = {
      ...(response.subscriptions ?? {}),
      followerCount: getProviderFollowers(provider.id).length,
    };
  }

  if (dashboardType === "services") {
    response.serviceLiveSetupRequests = getServiceLiveSetupRequests(provider?.id);
  }

  return response;
}
