import { prisma } from "./prisma";
import { getConversionAttributionSummary } from "./analytics-service";
import { getFeaturedSupplierSessions } from "./live-service";
import type {
  ConversionAttributionSource,
  ProcurementAgentDashboardData,
  ProcurementAgentReferralRow,
} from "./types";

const attributionSources: ConversionAttributionSource[] = [
  "agent_referral",
  "shared_link",
  "linkedin",
  "highlight_video",
];

const sourceLabels: Record<ConversionAttributionSource, string> = {
  live: "Live",
  replay: "Replay",
  linkedin: "LinkedIn",
  agent_referral: "Agent referral",
  highlight_video: "Highlight video",
  shared_link: "Shared link",
  direct_dashboard: "Direct dashboard",
};

export function buildReferralLink(liveId: string, referralCode: string) {
  return `/live/${liveId}?ref=procurement-agent&referral=${referralCode}&utm_source=buyamia_agent&utm_medium=b2b_referral&utm_campaign=procurement_agent`;
}

function formatSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function getProcurementAgentDashboardData(): Promise<ProcurementAgentDashboardData> {
  const [shareableSessions, conversionAttribution, events] = await Promise.all([
    getFeaturedSupplierSessions(),
    getConversionAttributionSummary(),
    prisma.analyticsEvent.findMany({
      where: {
        liveId: { not: null },
        conversionSource: { in: attributionSources },
      },
      select: {
        liveId: true,
        conversionSource: true,
        conversionIntent: true,
      },
    }),
  ]);

  const liveEventMap = new Map<
    string,
    {
      sourceCounts: Partial<Record<ConversionAttributionSource, number>>;
      attributedRfqs: number;
      attributedOrders: number;
    }
  >();

  for (const event of events) {
    if (!event.liveId) {
      continue;
    }

    const liveId = event.liveId;
    const current =
      liveEventMap.get(liveId) ?? {
        sourceCounts: {},
        attributedRfqs: 0,
        attributedOrders: 0,
      };

    const source = event.conversionSource as ConversionAttributionSource;
    current.sourceCounts[source] = (current.sourceCounts[source] ?? 0) + 1;

    if (event.conversionIntent && ["rfq", "sample_request", "quote_follow_up"].includes(event.conversionIntent)) {
      current.attributedRfqs += 1;
    }

    if (event.conversionIntent === "order") {
      current.attributedOrders += 1;
    }

    liveEventMap.set(liveId, current);
  }

  const referredLives = shareableSessions.map((session, index) => {
    const liveMetrics =
      liveEventMap.get(session.id) ?? {
        sourceCounts: {},
        attributedRfqs: 0,
        attributedOrders: 0,
      };

    const clicks = Math.max(
      48,
      Math.round(
        session.viewerCount * 0.09 +
          session.replayViews * 0.016 +
          session.trustScore.score * 1.3 +
          (liveMetrics.attributedRfqs + liveMetrics.attributedOrders) * 10 +
          index * 7,
      ),
    );
    const referredSessions = Math.max(1, Math.round(clicks * 0.22));
    const attributedRfqs = Math.max(
      liveMetrics.attributedRfqs,
      Math.max(1, Math.round(clicks * 0.08)),
    );
    const attributedOrders = Math.max(
      liveMetrics.attributedOrders,
      Math.max(0, Math.round(clicks * 0.03)),
    );
    const estimatedCommission = Math.round(
      attributedRfqs * 42 + attributedOrders * 68 + clicks * 0.18,
    );
    const conversionRate = clicks > 0 ? Math.round(((attributedRfqs + attributedOrders) / clicks) * 100) : 0;
    const topSource = topSourceLabel(liveMetrics.sourceCounts);
    const referralCode = buildReferralCode(session.id, session.providerName);

    return {
      liveId: session.id,
      title: session.title,
      providerName: session.providerName,
      providerRole: session.providerRole,
      category: session.category,
      sessionLabel: `${session.featureCategory} session`,
      referralSourceLabel: topSource,
      referralLink: buildReferralLink(session.id, referralCode),
      clicks,
      referredSessions,
      attributedRfqs,
      attributedOrders,
      estimatedCommission,
      conversionRate,
    };
  });

  const totalClicks = referredLives.reduce((sum, row) => sum + row.clicks, 0);
  const totalReferredSessions = referredLives.reduce((sum, row) => sum + row.referredSessions, 0);
  const totalRfqs = referredLives.reduce((sum, row) => sum + row.attributedRfqs, 0);
  const totalOrders = referredLives.reduce((sum, row) => sum + row.attributedOrders, 0);
  const totalCommission = referredLives.reduce((sum, row) => sum + row.estimatedCommission, 0);
  const conversionRate = totalClicks > 0 ? Math.round(((totalRfqs + totalOrders) / totalClicks) * 100) : 0;
  const topPerformingLive = [...referredLives].sort(
    (left, right) => right.estimatedCommission - left.estimatedCommission,
  )[0] ?? null;

  return {
    shareableSessions: shareableSessions.map((session) => ({
      ...session,
      referralLink: buildReferralLink(session.id, buildReferralCode(session.id, session.providerName)),
    })),
    totalClicks,
    referredSessions: totalReferredSessions,
    attributedRfqs: totalRfqs,
    attributedOrders: totalOrders,
    estimatedCommission: totalCommission,
    conversionRate,
    topPerformingLive,
    referredLives,
    conversionAttribution,
  };
}

function buildReferralCode(liveId: string, providerName: string) {
  const seed = formatSlug(`${providerName}-${liveId}`);
  return `agent-${seed.slice(0, 18)}`;
}

function topSourceLabel(sourceCounts: Partial<Record<ConversionAttributionSource, number>>) {
  const sorted = Object.entries(sourceCounts).sort(([, left], [, right]) => (right ?? 0) - (left ?? 0));
  const [source, count] = sorted[0] ?? ["shared_link", 0];
  return count > 0 ? sourceLabels[source as ConversionAttributionSource] : "Shared link";
}
