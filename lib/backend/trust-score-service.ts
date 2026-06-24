import type { ProviderProfile, User } from "@prisma/client";
import type { SupplierTrustScore } from "./types";

type TrustProvider = Pick<
  ProviderProfile,
  | "completedOrders"
  | "responseRate"
  | "responseMinutes"
  | "certifications"
  | "bImpactScore"
  | "certifiedReviews"
> & {
  user: Pick<User, "verificationStatus">;
};

export function normalizeCertifications(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function points(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function verificationPoints(status: string) {
  if (status === "verified") return 20;
  if (status === "pending" || status === "needs_more_info") return 10;
  if (status === "not_started") return 4;
  return 0;
}

function responseTimePoints(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes <= 30) return 12;
  if (minutes <= 60) return 10;
  if (minutes <= 120) return 8;
  if (minutes <= 240) return 5;
  return 2;
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function calculateSupplierTrustScore(
  provider: TrustProvider,
  completedLiveSessions: number,
): SupplierTrustScore {
  const certifications = normalizeCertifications(provider.certifications);
  const completedOrderCount = safeNumber(provider.completedOrders);
  const responseRateValue = safeNumber(provider.responseRate);
  const responseMinutesValue = safeNumber(provider.responseMinutes);
  const bImpactScoreValue = safeNumber(provider.bImpactScore);
  const certifiedReviewCount = safeNumber(provider.certifiedReviews);
  const completedLiveSessionCount = safeNumber(completedLiveSessions);
  const verification = verificationPoints(provider.user.verificationStatus);
  const completedOrders = points((completedOrderCount / 100) * 16, 16);
  const responseRate = points((responseRateValue / 100) * 14, 14);
  const responseTime = responseTimePoints(responseMinutesValue);
  const certificationPoints = points(certifications.length * 3.5, 10);
  const bImpact = points((bImpactScoreValue / 100) * 10, 10);
  const completedLives = points((completedLiveSessionCount / 8) * 10, 10);
  const certifiedReviews = points((certifiedReviewCount / 60) * 8, 8);
  const score = points(
    verification +
      completedOrders +
      responseRate +
      responseTime +
      certificationPoints +
      bImpact +
      completedLives +
      certifiedReviews,
    100,
  );

  return {
    score,
    label: score >= 85 ? "Verified Trust Score" : score >= 70 ? "Trusted Supplier" : "Trust Building",
    completedOrders: completedOrderCount,
    responseRate: responseRateValue,
    averageResponseMinutes: responseMinutesValue,
    certifications,
    bImpactScore: bImpactScoreValue,
    completedLiveSessions: completedLiveSessionCount,
    certifiedReviews: certifiedReviewCount,
    breakdown: [
      {
        label: "Verification",
        value: provider.user.verificationStatus.replace(/_/g, " "),
        points: verification,
        maxPoints: 20,
        detail: "Business verification status from Buyamia provider records.",
      },
      {
        label: "Completed orders",
        value: String(completedOrderCount),
        points: completedOrders,
        maxPoints: 16,
        detail: "Demo/local completed procurement orders.",
      },
      {
        label: "Response rate",
        value: `${responseRateValue}%`,
        points: responseRate,
        maxPoints: 14,
        detail: "Share of buyer messages answered inside the local demo signal.",
      },
      {
        label: "Average response time",
        value: `${responseMinutesValue} min`,
        points: responseTime,
        maxPoints: 12,
        detail: "Faster supplier replies improve buyer confidence.",
      },
      {
        label: "Certifications",
        value: certifications.length ? certifications.join(", ") : "None listed",
        points: certificationPoints,
        maxPoints: 10,
        detail: "Trade, export, sustainability, and quality certifications.",
      },
      {
        label: "B-Impact score",
        value: String(bImpactScoreValue),
        points: bImpact,
        maxPoints: 10,
        detail: "Demo impact and responsible sourcing signal.",
      },
      {
        label: "Completed live sessions",
        value: String(completedLiveSessionCount),
        points: completedLives,
        maxPoints: 10,
        detail: "Completed lives and replays with supplier proof.",
      },
      {
        label: "Certified reviews",
        value: String(certifiedReviewCount),
        points: certifiedReviews,
        maxPoints: 8,
        detail: "Reviews marked as certified in demo supplier records.",
      },
    ],
  };
}
