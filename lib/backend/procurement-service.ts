import type { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";
import { getReplayStatus } from "./replay-policy";
import { calculateSupplierTrustScore } from "./trust-score-service";

const supplierRoles = ["hotel", "restaurant", "supplier", "service_provider"] as const;
const negotiationStatuses = ["open", "awaiting_response", "paused", "closed"] as const;
const riskStatuses = ["pending", "reviewed", "escalated", "dismissed"] as const;

const rfqSchema = z
  .object({
    title: z.string().trim().min(1, "Please enter an RFQ title."),
    category: z.string().trim().min(1, "Please enter a category."),
    requirements: z.string().trim().min(10, "Please describe the requirements."),
    budgetMin: z.coerce.number().nonnegative().optional().or(z.literal("").transform(() => undefined)),
    budgetMax: z.coerce.number().nonnegative().optional().or(z.literal("").transform(() => undefined)),
    deadline: z.string().trim().min(1, "Please select a deadline."),
    supplierType: z.enum(supplierRoles).optional().or(z.literal("").transform(() => undefined)),
  })
  .superRefine((value, context) => {
    const deadline = new Date(value.deadline);
    if (Number.isNaN(deadline.getTime())) {
      context.addIssue({ code: "custom", path: ["deadline"], message: "Please select a valid deadline." });
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const candidate = new Date(deadline);
      candidate.setHours(0, 0, 0, 0);
      if (candidate < today) {
        context.addIssue({ code: "custom", path: ["deadline"], message: "Deadline cannot be in the past." });
      }
    }

    if (value.budgetMin !== undefined && value.budgetMax !== undefined && value.budgetMin > value.budgetMax) {
      context.addIssue({ code: "custom", path: ["budgetMax"], message: "Maximum budget must be greater than minimum budget." });
    }
  });

const negotiationCreateSchema = z.object({
  title: z.string().trim().min(1, "Please enter a negotiation title."),
  providerId: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  rfqId: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  message: z.string().trim().optional(),
});

const negotiationUpdateSchema = z.object({
  status: z.enum(negotiationStatuses).optional(),
  message: z.string().trim().optional(),
});

const riskDecisionSchema = z.object({
  targetType: z.enum(["provider", "rfq"]),
  providerId: z.string().trim().optional(),
  rfqId: z.string().trim().optional(),
  riskLevel: z.enum(["low", "medium", "high"]),
  indicators: z.array(z.string()).default([]),
  reviewStatus: z.enum(riskStatuses),
  adminNote: z.string().trim().optional(),
});

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }
  return parsed.data;
}

export async function createRfq(adminId: string, input: unknown) {
  const parsed = parseOrThrow(rfqSchema, input);

  return prisma.rfq.create({
    data: {
      title: parsed.title,
      category: parsed.category,
      requirements: parsed.requirements,
      budgetMin: parsed.budgetMin,
      budgetMax: parsed.budgetMax,
      deadline: new Date(parsed.deadline),
      supplierType: parsed.supplierType as Role | undefined,
      createdById: adminId,
    },
  });
}

export async function listRfqs() {
  return prisma.rfq.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getRfq(id: string) {
  const rfq = await prisma.rfq.findUnique({
    where: { id },
    include: { negotiations: { include: { provider: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!rfq) {
    throw new ApiError("not_found", "RFQ not found.", 404);
  }
  return rfq;
}

export async function rankSuppliers(options: {
  search?: string;
  category?: string;
  verification?: string;
  location?: string;
  sort?: string;
} = {}) {
  const providers = await prisma.providerProfile.findMany({
    include: {
      user: true,
      followers: true,
      lives: true,
      analyticsEvents: true,
    },
  });

  const rows = providers.map((provider) => {
    const replayViews = provider.analyticsEvents.filter((event) => event.eventType === "replay_viewed").length;
    const trustScore = calculateSupplierTrustScore(
      provider,
      provider.lives.filter((live) => live.status === "completed").length,
    );
    return {
      id: provider.id,
      name: provider.displayName,
      category: provider.category,
      verificationStatus: provider.user.verificationStatus,
      location: provider.location ?? "",
      description: provider.description ?? "",
      followers: provider.followers.length,
      lives: provider.lives.length,
      replayViews,
      trustScore,
      verifiedRank: provider.user.verificationStatus === "verified" ? 1 : 0,
      detailHref: `/dashboard/main/suppliers/${provider.id}`,
    };
  });

  const search = options.search?.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (search && !`${row.name} ${row.category} ${row.location} ${row.description}`.toLowerCase().includes(search)) {
      return false;
    }
    if (options.category && options.category !== "all" && row.category !== options.category) {
      return false;
    }
    if (options.verification && options.verification !== "all" && row.verificationStatus !== options.verification) {
      return false;
    }
    if (options.location && options.location !== "all" && row.location !== options.location) {
      return false;
    }
    return true;
  });

  const sort = options.sort ?? "verification";
  return filtered.sort((a, b) => {
    if (sort === "followers") return b.followers - a.followers;
    if (sort === "lives") return b.lives - a.lives;
    if (sort === "replayViews") return b.replayViews - a.replayViews;
    if (sort === "trustScore") return b.trustScore.score - a.trustScore.score;
    return b.verifiedRank - a.verifiedRank || b.followers - a.followers || b.lives - a.lives;
  });
}

export async function getSupplierDetail(id: string) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      followers: true,
      lives: { orderBy: { createdAt: "desc" } },
      liveRequests: { orderBy: { createdAt: "desc" } },
      analyticsEvents: true,
    },
  });
  if (!provider) {
    throw new ApiError("not_found", "Supplier not found.", 404);
  }
  return {
    ...provider,
    trustScore: calculateSupplierTrustScore(
      provider,
      provider.lives.filter((live) => live.status === "completed").length,
    ),
  };
}

const negotiationInclude = {
  provider: true,
  rfq: true,
  messages: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.NegotiationInclude;

export async function listNegotiations() {
  return prisma.negotiation.findMany({ orderBy: { updatedAt: "desc" }, include: negotiationInclude });
}

export async function getNegotiation(id: string) {
  const negotiation = await prisma.negotiation.findUnique({ where: { id }, include: negotiationInclude });
  if (!negotiation) {
    throw new ApiError("not_found", "Negotiation not found.", 404);
  }
  return negotiation;
}

export async function createNegotiation(adminId: string, input: unknown) {
  const parsed = parseOrThrow(negotiationCreateSchema, input);
  const created = await prisma.negotiation.create({
    data: {
      title: parsed.title,
      providerId: parsed.providerId,
      rfqId: parsed.rfqId,
      createdById: adminId,
      messages: parsed.message
        ? { create: { authorId: adminId, body: parsed.message } }
        : undefined,
    },
    include: negotiationInclude,
  });
  return created;
}

export async function updateNegotiation(adminId: string, id: string, input: unknown) {
  const parsed = parseOrThrow(negotiationUpdateSchema, input);
  await getNegotiation(id);

  if (parsed.message) {
    await prisma.negotiationMessage.create({
      data: { negotiationId: id, authorId: adminId, body: parsed.message },
    });
  }

  return prisma.negotiation.update({
    where: { id },
    data: { status: parsed.status },
    include: negotiationInclude,
  });
}

export async function listRiskItems(filters: { role?: string; verification?: string; riskLevel?: string } = {}) {
  const [providers, rfqs, reviews] = await Promise.all([
    prisma.providerProfile.findMany({
      include: {
        user: true,
        liveRequests: true,
        lives: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rfq.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.riskReview.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);

  const latestReview = new Map<string, (typeof reviews)[number]>();
  for (const review of reviews) {
    const key = review.providerId ? `provider:${review.providerId}` : `rfq:${review.rfqId}`;
    if (!latestReview.has(key)) latestReview.set(key, review);
  }

  const providerItems = providers.map((provider) => {
    const indicators: string[] = [];
    if (provider.user.verificationStatus !== "verified") indicators.push(`Verification is ${provider.user.verificationStatus.replace(/_/g, " ")}`);
    if (!provider.description || !provider.location) indicators.push("Profile is incomplete");
    if (provider.liveRequests.some((request) => request.status === "rejected")) indicators.push("Has rejected live requests");
    if (provider.lives.some((live) => getReplayStatus(live.replayExpiresAt).status === "expired")) indicators.push("Has expired replay");
    const riskLevel = indicators.some((item) => item.includes("rejected") || item.includes("Verification is rejected"))
      ? "high"
      : indicators.length
        ? "medium"
        : "low";
    const review = latestReview.get(`provider:${provider.id}`);
    return {
      targetType: "provider",
      providerId: provider.id,
      rfqId: "",
      title: provider.displayName,
      role: provider.category,
      verificationStatus: provider.user.verificationStatus,
      riskLevel,
      indicators,
      reviewStatus: review?.reviewStatus ?? "pending",
      adminNote: review?.adminNote ?? "",
      detailHref: `/dashboard/main/suppliers/${provider.id}`,
    };
  });

  const rfqItems = rfqs.map((rfq) => {
    const indicators: string[] = [];
    if (rfq.deadline < new Date()) indicators.push("RFQ deadline has passed");
    if (!rfq.budgetMin && !rfq.budgetMax) indicators.push("Budget range is missing");
    if (rfq.requirements.length < 40) indicators.push("Requirements are brief");
    const riskLevel = rfq.deadline < new Date() ? "high" : indicators.length ? "medium" : "low";
    const review = latestReview.get(`rfq:${rfq.id}`);
    return {
      targetType: "rfq",
      providerId: "",
      rfqId: rfq.id,
      title: rfq.title,
      role: rfq.supplierType ?? "supplier",
      verificationStatus: "not_started",
      riskLevel,
      indicators,
      reviewStatus: review?.reviewStatus ?? "pending",
      adminNote: review?.adminNote ?? "",
      detailHref: `/dashboard/main/rfqs/${rfq.id}`,
    };
  });

  return [...providerItems, ...rfqItems].filter((item) => {
    if (filters.role && filters.role !== "all" && item.role !== filters.role) return false;
    if (filters.verification && filters.verification !== "all" && item.verificationStatus !== filters.verification) return false;
    if (filters.riskLevel && filters.riskLevel !== "all" && item.riskLevel !== filters.riskLevel) return false;
    return true;
  });
}

export async function recordRiskDecision(adminId: string, input: unknown) {
  const parsed = parseOrThrow(riskDecisionSchema, input);
  if (parsed.targetType === "provider" && !parsed.providerId) {
    throw new ValidationApiError({ providerId: "Provider is required." });
  }
  if (parsed.targetType === "rfq" && !parsed.rfqId) {
    throw new ValidationApiError({ rfqId: "RFQ is required." });
  }

  return prisma.riskReview.create({
    data: {
      targetType: parsed.targetType,
      providerId: parsed.providerId,
      rfqId: parsed.rfqId,
      riskLevel: parsed.riskLevel,
      indicators: parsed.indicators as Prisma.InputJsonValue,
      reviewStatus: parsed.reviewStatus,
      adminNote: parsed.adminNote,
      reviewerId: adminId,
      reviewedAt: new Date(),
    },
  });
}

export async function listCalendarEvents(filters: { category?: string; role?: string; status?: string } = {}) {
  const [liveRequests, lives, verifications] = await Promise.all([
    prisma.liveRequest.findMany({ include: { provider: true } }),
    prisma.live.findMany({ include: { provider: true } }),
    prisma.verificationRequest.findMany({ include: { user: { include: { providerProfile: true } } } }),
  ]);

  const events = [
    ...liveRequests.map((request) => ({
      id: `request:${request.id}`,
      title: `Preferred live request: ${request.title}`,
      date: request.preferredDate,
      category: request.category,
      role: request.provider.category,
      status: request.status,
      type: "preferred_live_request",
      detailHref: `/dashboard/main/calendar?focus=request:${request.id}`,
    })),
    ...lives.flatMap((live) => {
      const rows = [];
      if (live.scheduledAt) {
        rows.push({
          id: `live:${live.id}`,
          title: `Scheduled live: ${live.title}`,
          date: live.scheduledAt,
          category: live.category,
          role: live.provider.category,
          status: live.status,
          type: "scheduled_live",
          detailHref: `/live/${live.id}`,
        });
      }
      if (live.replayExpiresAt) {
        rows.push({
          id: `replay:${live.id}`,
          title: `Replay expires: ${live.title}`,
          date: live.replayExpiresAt,
          category: live.category,
          role: live.provider.category,
          status: getReplayStatus(live.replayExpiresAt).status,
          type: "replay_expiration",
          detailHref: `/live/${live.id}`,
        });
      }
      return rows;
    }),
    ...verifications.map((verification) => ({
      id: `verification:${verification.id}`,
      title: `Verification review: ${verification.user.name}`,
      date: verification.reviewedAt ?? verification.submittedAt,
      category: "verification",
      role: verification.user.role,
      status: verification.status,
      type: "verification_review",
      detailHref: "/dashboard/main/risk",
    })),
  ];

  return events
    .filter((event) => {
      if (filters.category && filters.category !== "all" && event.category !== filters.category) return false;
      if (filters.role && filters.role !== "all" && event.role !== filters.role) return false;
      if (filters.status && filters.status !== "all" && event.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((event) => ({ ...event, date: event.date.toISOString() }));
}
