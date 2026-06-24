import type { Prisma } from "@prisma/client";
import type {
  ConversionAttributionSource,
  ConversionAttributionSourceSummary,
  ConversionAttributionSummary,
  DashboardType,
  IntentInsightsSummary,
  MainAnalyticsSummary,
  ProviderAnalyticsSummary,
  ViewerAnalyticsSummary,
} from "./types";
import { prisma } from "./prisma";
import { getReplayStatus } from "./replay-policy";

const conversionSources: { source: ConversionAttributionSource; label: string }[] = [
  { source: "live", label: "Live" },
  { source: "replay", label: "Replay" },
  { source: "linkedin", label: "LinkedIn" },
  { source: "agent_referral", label: "Agent referral" },
  { source: "highlight_video", label: "Highlight video" },
  { source: "shared_link", label: "Shared link" },
  { source: "direct_dashboard", label: "Direct dashboard" },
];

const conversionEventTypes = new Set([
  "conversion_intent",
  "rfq_created",
  "rfq_requested",
  "sample_requested",
  "order_created",
  "checkout_started",
  "quote_requested",
]);

const demoAttributionRows: ConversionAttributionSourceSummary[] = [
  {
    source: "live",
    label: "Live",
    conversions: 46,
    conversionRate: 18,
    intentLabel: "RFQ / sample request",
    assistedRevenueLabel: "$72.4K",
    changeLabel: "+12%",
  },
  {
    source: "replay",
    label: "Replay",
    conversions: 33,
    conversionRate: 14,
    intentLabel: "Quote follow-up",
    assistedRevenueLabel: "$48.9K",
    changeLabel: "+9%",
  },
  {
    source: "linkedin",
    label: "LinkedIn",
    conversions: 18,
    conversionRate: 9,
    intentLabel: "Supplier profile view",
    assistedRevenueLabel: "$22.1K",
    changeLabel: "+5%",
  },
  {
    source: "agent_referral",
    label: "Agent referral",
    conversions: 27,
    conversionRate: 16,
    intentLabel: "Negotiated RFQ",
    assistedRevenueLabel: "$39.6K",
    changeLabel: "+15%",
  },
  {
    source: "highlight_video",
    label: "Highlight video",
    conversions: 21,
    conversionRate: 11,
    intentLabel: "Replay save",
    assistedRevenueLabel: "$18.7K",
    changeLabel: "+7%",
  },
  {
    source: "shared_link",
    label: "Shared link",
    conversions: 15,
    conversionRate: 8,
    intentLabel: "Sample request",
    assistedRevenueLabel: "$12.8K",
    changeLabel: "+4%",
  },
  {
    source: "direct_dashboard",
    label: "Direct dashboard",
    conversions: 12,
    conversionRate: 7,
    intentLabel: "Direct order",
    assistedRevenueLabel: "$10.4K",
    changeLabel: "+3%",
  },
];

const demoIntentMix: Record<ConversionAttributionSource, Record<string, number>> = {
  live: { rfq: 22, sample_request: 14, order: 10 },
  replay: { quote_follow_up: 15, rfq: 11, replay_save: 7 },
  linkedin: { profile_view: 8, rfq: 6, follow: 4 },
  agent_referral: { negotiated_rfq: 16, order: 7, sample_request: 4 },
  highlight_video: { replay_save: 9, sample_request: 7, rfq: 5 },
  shared_link: { sample_request: 7, rfq: 5, order: 3 },
  direct_dashboard: { order: 5, rfq: 4, quote_follow_up: 3 },
};

const demoIntentInsights: IntentInsightsSummary = {
  totalSignals: 142,
  topBuyerIntent: {
    label: "Asked about MOQ",
    count: 41,
    detail: "Buyers repeatedly request split MOQ and sample thresholds during live sessions and replays.",
  },
  mostCommonHesitation: {
    label: "Pricing hesitation",
    count: 28,
    detail: "Price tier comparisons and shipping inclusions are the most common pause points.",
  },
  mostComparedProducts: {
    label: "Rattan lounge chair vs daybed",
    count: 17,
    detail: "Most comparison intent clusters around the hero seating bundle.",
  },
  bundleRequests: {
    label: "Bundle requests",
    count: 23,
    detail: "Buyers want product, sample, and shipping bundles to reduce follow-up.",
  },
  rejectedReasons: [
    { label: "Lead time too long", count: 9 },
    { label: "Shipping too high", count: 7 },
    { label: "Finish mismatch", count: 5 },
  ],
  rfqSampleIntent: {
    rfq: 39,
    sample: 18,
    detail: "RFQ and sample intent remain the strongest conversion path from live and replay sessions.",
  },
};

const liveIntentEventTypes = new Set([
  "live_question_submitted",
  "live_intent_signal",
  "question_answered",
  "intent_captured",
  "product_clicked",
  "replay_moment_clicked",
]);

export async function createAnalyticsEvent(input: {
  userId?: string;
  providerId?: string;
  liveId?: string;
  eventType: string;
  conversionSource?: ConversionAttributionSource;
  conversionIntent?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.analyticsEvent.create({
    data: {
      userId: input.userId,
      providerId: input.providerId,
      liveId: input.liveId,
      eventType: input.eventType,
      conversionSource: input.conversionSource,
      conversionIntent: input.conversionIntent,
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
    conversionAttribution: await getConversionAttributionSummary(),
    intentInsights: await getIntentInsightsSummary(),
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
    conversionAttribution: await getConversionAttributionSummary({ providerId }),
    intentInsights: await getIntentInsightsSummary({ providerId }),
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
    conversionAttribution: await getConversionAttributionSummary({ userId: viewerId }),
    intentInsights: await getIntentInsightsSummary({ userId: viewerId }),
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

export async function getConversionAttributionSummary(scope: {
  userId?: string | null;
  providerId?: string | null;
} = {}): Promise<ConversionAttributionSummary> {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      ...(scope.userId ? { userId: scope.userId } : {}),
      ...(scope.providerId ? { providerId: scope.providerId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 250,
    include: { live: { select: { status: true } } },
  });

  const grouped = new Map<ConversionAttributionSource, { conversions: number; intents: Map<string, number> }>();

  for (const event of events) {
    const source = normalizeAttributionSource(
      event.conversionSource ?? metadataString(event.metadata, "conversionSource") ?? metadataString(event.metadata, "source"),
      event.eventType,
      event.live?.status,
    );
    const isConversionEvent = Boolean(source) || conversionEventTypes.has(event.eventType) || event.eventType.includes("conversion");

    if (!isConversionEvent) {
      continue;
    }

    const resolvedSource = source ?? "direct_dashboard";
    const intent =
      event.conversionIntent ??
      metadataString(event.metadata, "conversionIntent") ??
      metadataString(event.metadata, "intent") ??
      intentFromEventType(event.eventType);
    const current = grouped.get(resolvedSource) ?? { conversions: 0, intents: new Map<string, number>() };

    current.conversions += 1;
    current.intents.set(intent, (current.intents.get(intent) ?? 0) + 1);
    grouped.set(resolvedSource, current);
  }

  if (grouped.size === 0) {
    return createAttributionSummary(demoAttributionRows, demoIntentMix);
  }

  const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.conversions, 0);
  const rows = conversionSources.map(({ source, label }) => {
    const item = grouped.get(source);
    const conversions = item?.conversions ?? 0;
    const topIntent = topIntentLabel(item?.intents);

    return {
      source,
      label,
      conversions,
      conversionRate: total > 0 ? Math.round((conversions / total) * 100) : 0,
      intentLabel: topIntent,
      assistedRevenueLabel: demoAttributionRows.find((row) => row.source === source)?.assistedRevenueLabel ?? "$0",
      changeLabel: conversions > 0 ? "Live data" : "No events",
    };
  });
  const intents = Object.fromEntries(
    conversionSources.map(({ source }) => [
      source,
      Object.fromEntries(grouped.get(source)?.intents ?? new Map<string, number>()),
    ]),
  ) as Record<ConversionAttributionSource, Record<string, number>>;

  return createAttributionSummary(rows, intents);
}

export async function getIntentInsightsSummary(scope: {
  userId?: string | null;
  providerId?: string | null;
} = {}): Promise<IntentInsightsSummary> {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      ...(scope.userId ? { userId: scope.userId } : {}),
      ...(scope.providerId ? { providerId: scope.providerId } : {}),
      OR: [
        { eventType: { in: [...liveIntentEventTypes] } },
        { conversionIntent: { not: null } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 400,
  });

  if (events.length === 0) {
    return demoIntentInsights;
  }

  const intentCounts = new Map<string, number>();
  const hesitationCounts = new Map<string, number>();
  const comparedProducts = new Map<string, number>();
  const rejectedReasons = new Map<string, number>();
  const bundleRequestCounts = new Map<string, number>();
  let rfqCount = 0;
  let sampleCount = 0;

  for (const event of events) {
    const category = normalizeIntentCategory(
      metadataString(event.metadata, "intentCategory") ??
        metadataString(event.metadata, "category") ??
        event.conversionIntent ??
        event.eventType,
    );
    const product = metadataString(event.metadata, "product") ?? metadataString(event.metadata, "comparedProduct");
    const hesitation = metadataString(event.metadata, "hesitation") ?? metadataString(event.metadata, "reason");
    const rejection = metadataString(event.metadata, "rejectionReason") ?? metadataString(event.metadata, "reason");

    if (category) {
      intentCounts.set(category, (intentCounts.get(category) ?? 0) + 1);
    }

    if (category === "hesitation" || category === "pricing") {
      const label = hesitation ?? "Price / shipping concern";
      hesitationCounts.set(label, (hesitationCounts.get(label) ?? 0) + 1);
    }

    if (category === "comparison" && product) {
      comparedProducts.set(product, (comparedProducts.get(product) ?? 0) + 1);
    }

    if (category === "bundle_request") {
      const label = product ?? "Bundle request";
      bundleRequestCounts.set(label, (bundleRequestCounts.get(label) ?? 0) + 1);
    }

    if (category === "rejection") {
      const label = rejection ?? "Product rejected";
      rejectedReasons.set(label, (rejectedReasons.get(label) ?? 0) + 1);
    }

    if (event.conversionIntent === "rfq") {
      rfqCount += 1;
    }
    if (event.conversionIntent === "sample_request") {
      sampleCount += 1;
    }
  }

  const topIntent = topEntry(intentCounts, "Asked about MOQ");
  const hesitation = topEntry(hesitationCounts, "Pricing hesitation");
  const compared = topEntry(comparedProducts, "Rattan lounge chair vs daybed");
  const bundle = topEntry(bundleRequestCounts, "Bundle request");

  return {
    totalSignals: events.length,
    topBuyerIntent: {
      label: formatIntentLabel(topIntent.label),
      count: topIntent.count,
      detail: "Derived from live questions, transcript tags, and conversion events.",
    },
    mostCommonHesitation: {
      label: hesitation.label,
      count: hesitation.count,
      detail: "Captured from price, shipping, and comparison hesitation events.",
    },
    mostComparedProducts: {
      label: compared.label,
      count: compared.count,
      detail: "Most compared products are extracted from live question and product click metadata.",
    },
    bundleRequests: {
      label: bundle.label,
      count: bundle.count,
      detail: "Bundle intent combines product, sample, and shipping requests.",
    },
    rejectedReasons: [...rejectedReasons.entries()]
      .sort(([, left], [, right]) => right - left)
      .slice(0, 3)
      .map(([label, count]) => ({ label, count })),
    rfqSampleIntent: {
      rfq: rfqCount,
      sample: sampleCount,
      detail: "RFQ and sample actions are reused across live and replay conversion paths.",
    },
  };
}

function createAttributionSummary(
  rows: ConversionAttributionSourceSummary[],
  intentMix: Record<ConversionAttributionSource, Record<string, number>>,
): ConversionAttributionSummary {
  const sortedRows = [...rows].sort((a, b) => b.conversions - a.conversions || b.conversionRate - a.conversionRate);
  const topChannel = sortedRows[0] ?? demoAttributionRows[0];

  return {
    totalConversions: rows.reduce((sum, row) => sum + row.conversions, 0),
    topChannel,
    sources: rows,
    intentBySource: rows.map((row) => ({
      source: row.source,
      label: row.label,
      totalConversions: row.conversions,
      intents: Object.entries(intentMix[row.source] ?? {})
        .sort(([, left], [, right]) => right - left)
        .map(([intent, conversions]) => ({
          intent,
          label: formatAttributionLabel(intent),
          conversions,
        })),
    })),
  };
}

function normalizeAttributionSource(
  value: string | undefined,
  eventType: string,
  liveStatus?: string,
): ConversionAttributionSource | undefined {
  const normalized = value?.toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized && conversionSources.some((item) => item.source === normalized)) {
    return normalized as ConversionAttributionSource;
  }

  if (eventType.includes("replay") || liveStatus === "completed") {
    return "replay";
  }

  if (eventType.includes("live") || liveStatus === "active" || liveStatus === "scheduled") {
    return "live";
  }

  return undefined;
}

function metadataString(metadata: Prisma.JsonValue | null, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

function intentFromEventType(eventType: string) {
  if (eventType.includes("sample")) {
    return "sample_request";
  }

  if (eventType.includes("order") || eventType.includes("checkout")) {
    return "order";
  }

  if (eventType.includes("quote")) {
    return "quote_follow_up";
  }

  if (eventType.includes("rfq")) {
    return "rfq";
  }

  return "conversion_intent";
}

function topIntentLabel(intents?: Map<string, number>) {
  if (!intents || intents.size === 0) {
    return "No tracked intent";
  }

  const [intent] = [...intents.entries()].sort(([, left], [, right]) => right - left)[0];
  return formatAttributionLabel(intent);
}

function formatAttributionLabel(value: string) {
  return value.replace(/_/g, " ");
}

function normalizeIntentCategory(value: string | undefined) {
  const normalized = value?.toLowerCase().replace(/[\s-]+/g, "_");

  if (!normalized) {
    return undefined;
  }

  if (["moq", "minimum_order_quantity"].includes(normalized)) return "MOQ";
  if (["shipping", "shipment", "delivery"].includes(normalized)) return "shipping";
  if (["pricing", "price", "cost"].includes(normalized)) return "pricing";
  if (["quality", "finish", "material"].includes(normalized)) return "quality";
  if (["comparison", "compare", "compared"].includes(normalized)) return "comparison";
  if (["hesitation", "hesitate", "pause"].includes(normalized)) return "hesitation";
  if (["rejection", "reject", "rejected"].includes(normalized)) return "rejection";
  if (["bundle_request", "bundle", "bundle_requested"].includes(normalized)) return "bundle_request";
  if (["availability", "stock", "inventory"].includes(normalized)) return "availability";
  if (["policy", "warranty", "terms"].includes(normalized)) return "policy";
  if (["rfq", "quote_follow_up", "sample_request", "order", "conversion_intent"].includes(normalized)) {
    return normalized === "sample_request" ? "availability" : "MOQ";
  }

  return undefined;
}

function topEntry(map: Map<string, number>, fallbackLabel: string) {
  if (map.size === 0) {
    return { label: fallbackLabel, count: 0 };
  }

  const [label, count] = [...map.entries()].sort(([, left], [, right]) => right - left)[0];
  return { label, count };
}

function formatIntentLabel(value: string) {
  return value.replace(/_/g, " ");
}
