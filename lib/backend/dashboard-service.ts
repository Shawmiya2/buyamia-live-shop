import type { DashboardResponse, DashboardType, ProfileType } from "./types";
import { dashboardRoleMap, getAllowedRolesForDashboard, isProviderRole } from "./role-guard";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { getAnalyticsSummary } from "./analytics-service";
import { getAdminLivePreview, getDashboardLiveSummary, getPinnedLives } from "./live-service";
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
  const isAdminViewer = user.role === "main_admin";
  const isProviderDashboard = dashboardType !== "main" && dashboardType !== "viewer";
  const providerId =
    isProviderDashboard && !isAdminViewer ? user.providerId : undefined;
  const providerRole =
    isProviderDashboard && isAdminViewer
      ? role as Exclude<ProfileType, "main_admin" | "viewer">
      : undefined;
  const liveSummary = await getDashboardLiveSummary({
    providerId,
    providerRole,
    previewLimit: 3,
  });
  const pinnedLives = dashboardType === "main" ? await getPinnedLives() : [];
  const mainLivePreview = dashboardType === "main" ? await getAdminLivePreview(3) : undefined;
  const response: DashboardResponse & { adminActivity?: unknown[]; pendingLiveRequests?: unknown[]; pendingVerifications?: unknown[] } = {
    dashboardType,
    role,
    auth: {
      authMode: "demo",
      accessChecked: true,
      allowedRoles: getAllowedRolesForDashboard(dashboardType),
      currentRole: user.role,
      currentUserId: user.id,
      accessGranted: true,
    },
    currentUserId: user.id,
    providerId,
    verificationStatus: user.verificationStatus,
    liveStats: liveSummary.liveStats,
    replayStats: liveSummary.replayStats,
    liveCatalog: mainLivePreview ?? liveSummary.liveCatalog,
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
