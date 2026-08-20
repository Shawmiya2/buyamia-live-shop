import type {
  AmbassadorTier,
  CommunityShareChannel,
  Prisma,
  ReferralSource,
  RewardReason,
} from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import type { SafeUser } from "./types";
import { isProviderRole } from "./role-guard";
import { calculateAmbassadorTier, calculateRewardPoints } from "./reward-service";

export type AmbassadorProfileWithActivity = Awaited<ReturnType<typeof getAmbassadorForUser>>;

export type AdminAmbassadorTierGroup = {
  tier: AmbassadorTier;
  _count: number;
};

const referralCodePrefix = "BMA";

export function buildAmbassadorReferralLink(referralCode: string) {
  return `/signup?ref=${encodeURIComponent(referralCode)}`;
}

export async function joinAmbassadorProgram(user: SafeUser) {
  if (user.role !== "viewer") {
    throw new ApiError("forbidden", "Only viewer accounts can join the ambassador program.", 403);
  }

  const existing = await prisma.ambassadorProfile.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    if (existing.status === "active") {
      return existing;
    }

    return prisma.ambassadorProfile.update({
      where: { id: existing.id },
      data: { status: "active" },
    });
  }

  return prisma.ambassadorProfile.create({
    data: {
      userId: user.id,
      status: "active",
      referralCode: await generateReferralCode(user),
    },
  });
}

export async function getAmbassadorForUser(userId: string) {
  const profile = await prisma.ambassadorProfile.findUnique({
    where: { userId },
    include: {
      referrals: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      rewards: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  return profile
    ? {
        ...profile,
        referralLink: buildAmbassadorReferralLink(profile.referralCode),
      }
    : null;
}

export async function requireAmbassador(user: SafeUser) {
  const profile = await getAmbassadorForUser(user.id);
  if (!profile || profile.status !== "active") {
    throw new ApiError("ambassador_required", "Join the ambassador program before using this action.", 403);
  }
  return profile;
}

export async function listAmbassadorRewards(user: SafeUser) {
  const profile = await requireAmbassador(user);
  return prisma.rewardLedger.findMany({
    where: { ambassadorId: profile.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCommunityShare(input: {
  user: SafeUser;
  channel: CommunityShareChannel;
  liveId?: string | null;
  providerId?: string | null;
  replay?: boolean;
}) {
  if (input.user.role !== "viewer") {
    throw new ApiError("forbidden", "Only viewer accounts can create ambassador shares.", 403);
  }

  if (!["copy_link", "whatsapp", "telegram", "linkedin", "email"].includes(input.channel)) {
    throw new ValidationApiError({ channel: "Please select a valid share channel." });
  }

  if (input.liveId) {
    await assertLiveExists(input.liveId);
  }
  if (input.providerId) {
    await assertProviderExists(input.providerId);
  }

  const share = await prisma.communityShare.create({
    data: {
      userId: input.user.id,
      channel: input.channel,
      liveId: input.liveId ?? null,
      providerId: input.providerId ?? null,
    },
  });

  const ambassador = await getAmbassadorForUser(input.user.id);
  if (ambassador?.status === "active") {
    await addRewardLedgerEntry({
      ambassadorId: ambassador.id,
      reason: input.replay ? "replay_share" : "live_share",
      note: input.replay
        ? "Shared replay content for demo ambassador credits."
        : "Shared a live session for demo ambassador credits.",
    });
  }

  return share;
}

export async function createReferral(input: {
  user: SafeUser;
  referredEmail?: string | null;
  referredUserId?: string | null;
  source?: ReferralSource;
}) {
  const ambassador = await requireAmbassador(input.user);
  const referredEmail = input.referredEmail?.trim().toLowerCase() || null;

  if (referredEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(referredEmail)) {
    throw new ValidationApiError({ referredEmail: "Please enter a valid email address." });
  }

  if (input.referredUserId) {
    const referredUser = await prisma.user.findUnique({ where: { id: input.referredUserId } });
    if (!referredUser) {
      throw new ApiError("not_found", "Referred user not found.", 404);
    }
  }

  const referral = await prisma.referral.create({
    data: {
      ambassadorId: ambassador.id,
      referredEmail,
      referredUserId: input.referredUserId ?? null,
      source: input.source ?? "direct_invite",
      status: input.referredUserId ? "signed_up" : "invited",
    },
  });

  if (input.referredUserId) {
    await addRewardLedgerEntry({
      ambassadorId: ambassador.id,
      reason: "referral_signup",
      note: "Demo credits for a referred signup.",
    });
  }

  return referral;
}

export async function addRewardLedgerEntry(input: {
  ambassadorId: string;
  reason: RewardReason;
  note: string;
  sourceAmount?: number | null;
  sourceCurrency?: string | null;
}) {
  const points = calculateRewardPoints({
    reason: input.reason,
    sourceAmount: input.sourceAmount,
  });

  return prisma.$transaction(async (tx) => {
    const reward = await tx.rewardLedger.create({
      data: {
        ambassadorId: input.ambassadorId,
        points,
        reason: input.reason,
        sourceAmount: input.sourceAmount ?? null,
        sourceCurrency: input.sourceCurrency ?? null,
        note: input.note,
      },
    });

    const total = await tx.rewardLedger.aggregate({
      where: { ambassadorId: input.ambassadorId },
      _sum: { points: true },
    });
    const totalPoints = total._sum.points ?? 0;

    await tx.ambassadorProfile.update({
      where: { id: input.ambassadorId },
      data: {
        totalPoints,
        tier: calculateAmbassadorTier(totalPoints),
      },
    });

    return reward;
  });
}

export async function getAdminAmbassadorOverview(options: { search?: string } = {}) {
  const search = options.search?.trim();
  const where: Prisma.AmbassadorProfileWhereInput | undefined = search
    ? {
        OR: [
          { referralCode: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }
    : undefined;

  const tierGroupsPromise = prisma.ambassadorProfile
    .groupBy({ by: ["tier"], _count: true })
    .then((groups): AdminAmbassadorTierGroup[] => groups);

  const [profiles, totalPoints, tierGroups, recentReferrals] = await Promise.all([
    prisma.ambassadorProfile.findMany({
      where,
      orderBy: [{ totalPoints: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        referrals: { orderBy: { createdAt: "desc" }, take: 5 },
        rewards: { orderBy: { createdAt: "desc" }, take: 5 },
        _count: { select: { referrals: true, rewards: true } },
      },
      take: 50,
    }),
    prisma.ambassadorProfile.aggregate({ _sum: { totalPoints: true }, _count: true }),
    tierGroupsPromise,
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        ambassador: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
  ]);

  return {
    totalAmbassadors: totalPoints._count,
    totalRewardPoints: totalPoints._sum.totalPoints ?? 0,
    tierGroups,
    recentReferrals,
    profiles,
  };
}

export async function getProviderAmbassadorEngagement(user: SafeUser) {
  if (!isProviderRole(user.role) || !user.providerId) {
    throw new ApiError("provider_required", "Provider engagement is available to provider roles only.", 403);
  }

  const providerId = user.providerId;
  const lives = await prisma.live.findMany({
    where: { providerId },
    select: { id: true },
  });
  const liveIds = lives.map((live) => live.id);

  const [sharesGenerated, referralsLinked, followerGrowth] = await Promise.all([
    prisma.communityShare.count({
      where: { OR: [{ providerId }, { liveId: { in: liveIds } }] },
    }),
    prisma.referral.count({
      where: {
        ambassador: {
          user: {
            communityShares: {
              some: { OR: [{ providerId }, { liveId: { in: liveIds } }] },
            },
          },
        },
      },
    }),
    prisma.follow.count({ where: { providerId } }),
  ]);

  return {
    providerId,
    sharesGenerated,
    referralsLinked,
    followerGrowth,
  };
}

async function generateReferralCode(user: SafeUser) {
  const base = `${referralCodePrefix}${user.name.replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase() || "USER"}`;

  for (let index = 0; index < 8; index += 1) {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const referralCode = `${base}${suffix}`;
    const existing = await prisma.ambassadorProfile.findUnique({ where: { referralCode } });
    if (!existing) return referralCode;
  }

  return `${referralCodePrefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

async function assertLiveExists(liveId: string) {
  const live = await prisma.live.findUnique({ where: { id: liveId } });
  if (!live) {
    throw new ApiError("not_found", "Live session not found.", 404);
  }
}

async function assertProviderExists(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Provider not found.", 404);
  }
}
