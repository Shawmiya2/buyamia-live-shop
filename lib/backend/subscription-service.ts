import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";
import { getLives } from "./live-service";
import type { Provider } from "./types";

function toProvider(input: {
  id: string;
  userId: string;
  displayName: string;
  category: string;
  user: { verificationStatus: string };
}): Provider {
  return {
    id: input.id,
    ownerUserId: input.userId,
    name: input.displayName,
    profileType: input.category as Provider["profileType"],
    verificationStatus: input.user.verificationStatus as Provider["verificationStatus"],
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

export async function getFollowedProviders(viewerUserId: string) {
  const follows = await prisma.follow.findMany({
    where: { viewerId: viewerUserId },
    include: { provider: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
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

export async function getAvailableProvidersForViewer(viewerUserId: string) {
  const followedIds = new Set((await getFollowedProviders(viewerUserId)).map((provider) => provider.id));
  const providers = await prisma.providerProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return providers.filter((provider) => !followedIds.has(provider.id)).map(toProvider);
}
