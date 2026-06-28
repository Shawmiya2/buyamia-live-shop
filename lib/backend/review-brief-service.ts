import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";

const reviewPeriods = ["last_7_days", "last_30_days", "last_90_days", "year_to_date"] as const;
const reviewSources = ["all", "verified_stays", "live_replay", "booking_channels"] as const;

const reviewBriefSchema = z.object({
  providerId: z.string().trim().optional(),
  reviewPeriod: z.enum(reviewPeriods, "Please select a valid review period."),
  reviewSource: z.enum(reviewSources, "Please select a valid review source."),
  language: z.string().trim().min(1, "Please select a language."),
});

export type ReviewBriefReport = {
  overallSentimentScore: number;
  positiveReviewSummary: string;
  negativeReviewSummary: string;
  mostMentionedTopics: string[];
  improvementOpportunities: string[];
  recommendedManagementActions: string[];
  managementSummary: string;
  generatedAt: string;
};

export async function listHotelProvidersForReviewBrief(user: { role: string; providerId?: string }) {
  if (user.role === "main_admin") {
    return prisma.providerProfile.findMany({
      where: { category: "hotel" },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    });
  }

  if (user.role !== "hotel" || !user.providerId) {
    throw new ApiError("forbidden", "Only hotel providers can generate review briefs.", 403);
  }

  return prisma.providerProfile.findMany({
    where: { id: user.providerId, category: "hotel" },
    select: { id: true, displayName: true },
  });
}

export async function generateReviewBrief(user: { role: string; providerId?: string }, input: unknown) {
  if (user.role !== "main_admin" && user.role !== "hotel") {
    throw new ApiError("forbidden", "Only hotel providers can generate review briefs.", 403);
  }

  const parsed = reviewBriefSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const providerId = user.role === "main_admin" ? parsed.data.providerId : user.providerId;
  if (!providerId) {
    throw new ValidationApiError({ providerId: "Please select a hotel." });
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: { user: true, lives: true, analyticsEvents: true },
  });
  if (!provider || provider.category !== "hotel") {
    throw new ApiError("not_found", "Hotel provider not found.", 404);
  }
  if (user.role !== "main_admin" && provider.id !== user.providerId) {
    throw new ApiError("forbidden", "You cannot generate review briefs for another hotel.", 403);
  }

  const report = buildMockReviewReport(provider, parsed.data.reviewPeriod, parsed.data.reviewSource, parsed.data.language);
  const brief = await prisma.reviewBrief.create({
    data: {
      providerId: provider.id,
      reviewPeriod: parsed.data.reviewPeriod,
      reviewSource: parsed.data.reviewSource,
      language: parsed.data.language,
      report: report as Prisma.InputJsonValue,
    },
  });

  return {
    id: brief.id,
    providerId: provider.id,
    hotelName: provider.displayName,
    reviewPeriod: brief.reviewPeriod,
    reviewSource: brief.reviewSource,
    language: brief.language,
    report,
  };
}

export async function listReviewBriefs(providerId?: string) {
  return prisma.reviewBrief.findMany({
    where: { providerId },
    orderBy: { generatedAt: "desc" },
    include: { provider: { select: { displayName: true, category: true } } },
  });
}

function buildMockReviewReport(
  provider: {
    displayName: string;
    certifiedReviews: number;
    lives: unknown[];
    analyticsEvents: unknown[];
  },
  reviewPeriod: string,
  reviewSource: string,
  language: string,
): ReviewBriefReport {
  const certifiedReviews = provider.certifiedReviews || 0;
  const liveSignals = provider.lives.length;
  const replaySignals = provider.analyticsEvents.length;
  const score = Math.max(62, Math.min(96, 72 + Math.round(certifiedReviews / 4) + Math.min(8, liveSignals + replaySignals)));
  const periodLabel = reviewPeriod.replace(/_/g, " ");
  const sourceLabel = reviewSource.replace(/_/g, " ");

  return {
    overallSentimentScore: score,
    positiveReviewSummary: `${provider.displayName} receives strong praise for room presentation, staff responsiveness, and trust signals across ${sourceLabel}.`,
    negativeReviewSummary: "Recurring friction appears around peak-hour check-in pacing, breakfast queue management, and clearer pre-arrival instructions.",
    mostMentionedTopics: ["Room cleanliness", "Staff responsiveness", "Breakfast pacing", "Live room accuracy", "Airport transfer"],
    improvementOpportunities: [
      "Add clearer arrival instructions to booking confirmations.",
      "Staff breakfast peak windows with one additional floor lead.",
      "Use live replay clips to set room-size expectations before booking.",
    ],
    recommendedManagementActions: [
      "Publish a replay-backed room proof highlight for the next booking push.",
      "Send a post-stay review request within 24 hours of checkout.",
      "Create a front-desk checklist for late arrivals and transfer bundles.",
    ],
    managementSummary: `Mock ${language} review brief for ${periodLabel}: sentiment is healthy, with operational gains available in arrival flow and breakfast throughput.`,
    generatedAt: new Date().toISOString(),
  };
}
