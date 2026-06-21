import type { Prisma } from "@prisma/client";
import type { DashboardType, MainAnalyticsSummary, ProviderAnalyticsSummary, ViewerAnalyticsSummary } from "./types";
import { prisma } from "./prisma";
import { getReplayStatus } from "./replay-policy";

export async function createAnalyticsEvent(input: {
  userId?: string;
  providerId?: string;
  liveId?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.analyticsEvent.create({
    data: {
      userId: input.userId,
      providerId: input.providerId,
      liveId: input.liveId,
      eventType: input.eventType,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getMainAnalyticsSummary(): Promise<MainAnalyticsSummary & { pendingLiveRequests: number; expiringReplays: number }> {
  const now = new Date();
  const [
    totalUsers,
    totalProviders,
    activeLives,
    pinnedLives,
    pendingVerifications,
    pendingLiveRequests,
    lives,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.providerProfile.count(),
    prisma.live.count({ where: { status: "active" } }),
    prisma.live.count({ where: { isPinned: true, OR: [{ pinExpiresAt: null }, { pinExpiresAt: { gt: now } }] } }),
    prisma.user.count({ where: { verificationStatus: { in: ["pending", "needs_more_info"] } } }),
    prisma.liveRequest.count({ where: { status: "pending_review" } }),
    prisma.live.findMany({ where: { replayExpiresAt: { not: null } }, select: { replayExpiresAt: true } }),
  ]);

  return {
    totalUsers,
    totalProviders,
    activeLives,
    pinnedLives,
    pendingVerifications,
    pendingLiveRequests,
    expiringReplays: lives.filter((live) => getReplayStatus(live.replayExpiresAt).status === "expiring_soon").length,
  };
}

export async function getProviderAnalyticsSummary(providerId: string): Promise<ProviderAnalyticsSummary & { pendingRequests: number }> {
  const [provider, lives, replayViews, followers, pendingRequests] = await Promise.all([
    prisma.providerProfile.findUnique({ where: { id: providerId }, include: { user: true } }),
    prisma.live.findMany({ where: { providerId } }),
    prisma.analyticsEvent.count({ where: { providerId, eventType: "replay_viewed" } }),
    prisma.follow.count({ where: { providerId } }),
    prisma.liveRequest.count({ where: { providerId, status: { in: ["draft", "pending_review"] } } }),
  ]);

  return {
    totalLives: lives.length,
    activeLives: lives.filter((live) => live.status === "active").length,
    replayViews,
    followers,
    pendingRequests,
    conversionIntent: 0,
    verificationStatus: provider?.user.verificationStatus ?? "not_started",
  };
}

export async function getViewerAnalyticsSummary(viewerId: string): Promise<ViewerAnalyticsSummary> {
  const follows = await prisma.follow.findMany({ where: { viewerId }, select: { providerId: true } });
  const providerIds = follows.map((follow) => follow.providerId);
  const now = new Date();
  const [upcomingLives, availableReplays, watchedLives] = await Promise.all([
    prisma.live.count({ where: { providerId: { in: providerIds }, status: "scheduled", scheduledAt: { gt: now } } }),
    prisma.live.count({ where: { providerId: { in: providerIds }, status: "completed", replayExpiresAt: { gt: now } } }),
    prisma.analyticsEvent.count({ where: { userId: viewerId, eventType: { in: ["live_viewed", "replay_viewed", "watched_live"] } } }),
  ]);

  return {
    followedProviders: follows.length,
    upcomingLives,
    availableReplays,
    watchedLives,
  };
}

export async function getAnalyticsSummary(dashboardType: DashboardType, userId?: string | null, providerId?: string | null) {
  if (dashboardType === "main") {
    return getMainAnalyticsSummary();
  }

  if (dashboardType === "viewer") {
    return getViewerAnalyticsSummary(userId ?? "");
  }

  return getProviderAnalyticsSummary(providerId ?? "");
}
