import type { DashboardResponse, DashboardType } from "./types";
import { dashboardRoleMap, isProviderRole } from "./role-guard";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { getAnalyticsSummary } from "./analytics-service";
import { getAdminLivePreview, getLives, getPinnedLives, listLives } from "./live-service";
import { listLiveRequests } from "./live-request-service";
import {
  getAvailableProvidersForViewer,
  getFollowedProviders,
  getProviderFollowers,
  getViewerReplayFeed,
  getViewerUpcomingLives,
} from "./subscription-service";
import { getRecentAdminActivity } from "./admin-activity-service";
import type { SafeUser } from "./types";

export const dashboardTypes: DashboardType[] = [
  "main",
  "hotel",
  "restaurant",
  "supplier",
  "services",
  "viewer",
];

export function isDashboardType(value: unknown): value is DashboardType {
  return typeof value === "string" && dashboardTypes.includes(value as DashboardType);
}

function getNextActions(dashboardType: DashboardType) {
  const actions: Record<DashboardType, string[]> = {
    main: ["Review pending verifications", "Review pending live requests", "Audit pinned lives"],
    hotel: ["Submit verification metadata", "Create a room live request", "Review replay expiration"],
    restaurant: ["Submit dining verification", "Create a chef live request", "Review follower growth"],
    supplier: ["Submit supplier verification", "Create a sourcing live request", "Review buyer analytics"],
    services: ["Submit service metadata", "Create a service live request", "Review replay availability"],
    viewer: ["Follow verified providers", "Watch upcoming lives", "Review available replays"],
  };

  return actions[dashboardType];
}

export async function getDashboardData(dashboardType: DashboardType, user: SafeUser): Promise<DashboardResponse & { adminActivity?: unknown[]; pendingLiveRequests?: unknown[]; pendingVerifications?: unknown[] }> {
  const role = dashboardRoleMap[dashboardType];
  const providerId =
    dashboardType === "main" || dashboardType === "viewer" ? undefined : user.providerId;
  const viewerLiveSummary = dashboardType === "viewer" ? await listLives({ page: 1, pageSize: 5, sort: "important" }) : undefined;
  const allLives = viewerLiveSummary ? viewerLiveSummary.items : await getLives(providerId);
  const pinnedLives = await getPinnedLives(providerId);
  const replayStats = {
    replayViews: allLives.reduce((sum, live) => sum + live.replayViews, 0),
    availableReplays: allLives.filter((live) => live.status === "replay" && live.replay.status !== "expired").length,
    expiringReplays: allLives.filter((live) => live.replay.status === "expiring_soon").length,
  };

  const mainLivePreview = dashboardType === "main" ? await getAdminLivePreview(3) : undefined;
  const response: DashboardResponse & { adminActivity?: unknown[]; pendingLiveRequests?: unknown[]; pendingVerifications?: unknown[] } = {
    dashboardType,
    role,
    currentUserId: user.id,
    providerId,
    verificationStatus: user.verificationStatus,
    liveStats: {
      totalLives: allLives.length,
      activeLives: allLives.filter((live) => live.status === "live").length,
      scheduledLives: allLives.filter((live) => live.status === "scheduled").length,
    },
    replayStats,
    liveCatalog: viewerLiveSummary?.items ?? mainLivePreview ?? allLives,
    pinnedLives,
    analyticsSummary: await getAnalyticsSummary(dashboardType, user.id, providerId),
    nextActions: getNextActions(dashboardType),
  };

  if (dashboardType === "viewer") {
    response.subscriptions = {
      followedProviders: await getFollowedProviders(user.id, { limit: 5 }),
      replayFeed: await getViewerReplayFeed(user.id),
      upcomingLives: await getViewerUpcomingLives(user.id),
      availableProviders: await getAvailableProvidersForViewer(user.id, { limit: 5 }),
    };
  }

  if (providerId) {
    response.subscriptions = {
      ...(response.subscriptions ?? {}),
      followerCount: (await getProviderFollowers(providerId)).length,
    };
    response.serviceLiveSetupRequests = await listLiveRequests({ providerId }) as never;
  }

  if (dashboardType === "main") {
    response.adminActivity = await getRecentAdminActivity();
    response.pendingLiveRequests = await listLiveRequests({ pendingOnly: true });
    response.pendingVerifications = await prisma.verificationRequest.findMany({
      where: { status: "pending" },
      orderBy: { submittedAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  return response;
}

export async function providerForCurrentUser(user: SafeUser) {
  if (!isProviderRole(user.role) || !user.providerId) {
    throw new ApiError("provider_required", "A provider profile is required.", 403);
  }
  return user.providerId;
}
