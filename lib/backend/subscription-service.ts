import { prisma } from "./prisma";
import type { Prisma, VerificationStatus } from "@prisma/client";
import { ApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";
import { getLives } from "./live-service";
import { calculateSupplierTrustScore } from "./trust-score-service";
import type { Provider } from "./types";

function toProvider(input: {
  id: string;
  userId: string;
  displayName: string;
  category: string;
  completedOrders: number;
  responseRate: number;
  responseMinutes: number;
  certifications: Prisma.JsonValue;
  bImpactScore: number;
  certifiedReviews: number;
  lives?: { id: string }[];
  user: { verificationStatus: VerificationStatus };
}): Provider {
  return {
    id: input.id,
    ownerUserId: input.userId,
    name: input.displayName,
    profileType: input.category as Provider["profileType"],
    verificationStatus: input.user.verificationStatus as Provider["verificationStatus"],
    trustScore: calculateSupplierTrustScore(input, input.lives?.length ?? 0).score,
  };
}

export async function followProvider(input: { viewerUserId: string; providerId: string }) {
  const viewer = await prisma.user.findUnique({ where: { id: input.viewerUserId } });
  if (!viewer || viewer.role !== "viewer") {
    throw new ApiError("forbidden", "Only viewer accounts can follow providers.", 403);
  }

  const provider = await prisma.providerProfile.findUnique({ where: { id: input.providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Provider not found.", 404);
  }

  const follow = await prisma.follow.upsert({
    where: { viewerId_providerId: { viewerId: viewer.id, providerId: provider.id } },
    update: {},
    create: { viewerId: viewer.id, providerId: provider.id },
  });

  await createAnalyticsEvent({
    userId: viewer.id,
    providerId: provider.id,
    eventType: "provider_followed",
  });

  return follow;
}

export async function unfollowProvider(input: { viewerUserId: string; providerId: string }) {
  await prisma.follow
    .delete({
      where: { viewerId_providerId: { viewerId: input.viewerUserId, providerId: input.providerId } },
    })
    .catch(() => null);

  await createAnalyticsEvent({
    userId: input.viewerUserId,
    providerId: input.providerId,
    eventType: "provider_unfollowed",
  });

  return { viewerUserId: input.viewerUserId, providerId: input.providerId };
}

const providerInclude = {
  user: true,
  lives: { where: { status: "completed" }, select: { id: true } },
} as const;

export async function getFollowedProviders(viewerUserId: string, options: { limit?: number } = {}) {
  const follows = await prisma.follow.findMany({
    where: { viewerId: viewerUserId },
    include: { provider: { include: providerInclude } },
    orderBy: { createdAt: "desc" },
    take: options.limit,
  });

  return follows.map((follow) => toProvider(follow.provider));
}

export async function getProviderFollowers(providerId: string) {
  return prisma.follow.findMany({ where: { providerId } });
}

export async function getViewerReplayFeed(viewerUserId: string) {
  const followed = await getFollowedProviders(viewerUserId);
  const ids = new Set(followed.map((provider) => provider.id));
  return (await getLives()).filter(
    (live) => ids.has(live.providerId) && live.status === "replay" && live.replay.status !== "expired",
  );
}

export async function getViewerUpcomingLives(viewerUserId: string) {
  const followed = await getFollowedProviders(viewerUserId);
  const ids = new Set(followed.map((provider) => provider.id));
  return (await getLives()).filter((live) => ids.has(live.providerId) && live.status === "scheduled");
}

export async function getAvailableProvidersForViewer(viewerUserId: string, options: { limit?: number } = {}) {
  const followedIds = (await prisma.follow.findMany({
    where: { viewerId: viewerUserId },
    select: { providerId: true },
  })).map((follow) => follow.providerId);
  const providers = await prisma.providerProfile.findMany({
    where: { id: { notIn: followedIds } },
    include: providerInclude,
    orderBy: { createdAt: "desc" },
    take: options.limit,
  });

  return providers.map(toProvider);
}
