import type { Live, Prisma, ProviderProfile, User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { createAnalyticsEvent } from "./analytics-service";
import { datePlusDays, defaultReplayAvailabilityDays, getReplayStatus } from "./replay-policy";
import { calculateSupplierTrustScore } from "./trust-score-service";
import { fieldErrorsFromZod } from "./validation";
import type {
  FeaturedSupplierCategory,
  FeaturedSupplierSession,
  LiveCommerceData,
  LiveIntentCategory,
  LiveIntentQuestion,
  SpecialistHost,
  LiveEvent,
  LiveListResponse,
  PinReason,
  ReplayTranscriptSegment,
  ReplayTranscriptTag,
  ReplayStatus,
} from "./types";

const pinSchema = z.object({
  isPinned: z.boolean(),
  pinReason: z.enum(["sponsored", "nearby", "most_watched", "featured_by_buyamia"]).optional(),
  pinExpiresAt: z.string().datetime().optional(),
  priorityScore: z.number().int().min(0).max(1000).optional(),
});

const replaySchema = z.object({
  extensionDays: z.number().int().positive().max(365).default(5),
});

const providerReplaySchema = z.object({
  expirationDate: z.string().trim().optional(),
  removeExpiration: z.coerce.boolean().optional(),
  visibility: z.enum(["public", "private"]).optional(),
}).superRefine((value, context) => {
  if (value.removeExpiration) {
    return;
  }
  if (value.expirationDate) {
    const expiration = new Date(`${value.expirationDate}T23:59:59`);
    if (Number.isNaN(expiration.getTime())) {
      context.addIssue({ code: "custom", path: ["expirationDate"], message: "Please select a valid expiration date." });
    }
    if (expiration <= new Date()) {
      context.addIssue({ code: "custom", path: ["expirationDate"], message: "Expiration date must be in the future." });
    }
  }
});

export const scheduleStreamFieldMessages = {
  title: "Please enter a stream title.",
  category: "Please select a category.",
  scheduledAt: "Please select a valid scheduled date and time.",
  scheduledAtPast: "The scheduled date and time must be in the future.",
  providerType: "Please select the provider type for your account.",
  duplicate: "A stream with this title is already scheduled at this time.",
} as const;

const scheduleProviderRoles = ["hotel", "restaurant", "supplier", "service_provider"] as const;

function requiredString(message: string, max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().min(1, message).max(max),
  );
}

const scheduleStreamSchema = z.object({
  title: requiredString(scheduleStreamFieldMessages.title, 120),
  category: requiredString(scheduleStreamFieldMessages.category, 80),
  scheduledAt: requiredString(scheduleStreamFieldMessages.scheduledAt, 80),
  providerType: z.enum(scheduleProviderRoles, scheduleStreamFieldMessages.providerType).optional(),
  estimatedDurationMinutes: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().int().min(15).max(480).optional(),
  ),
  language: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : undefined),
    z.string().trim().max(60).optional(),
  ),
  thumbnailUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : undefined),
    z.url("Please enter a valid thumbnail URL.").optional(),
  ),
  visibility: z.enum(["public", "private"]).default("public"),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : undefined),
    z.string().trim().max(1000).optional(),
  ),
});

type LiveWithProvider = Live & {
  provider: ProviderProfile & { user: User; lives?: Pick<Live, "id">[] };
};

const liveStatuses = ["scheduled", "active", "completed", "replay", "expired"] as const;
const providerRoles = ["hotel", "restaurant", "supplier", "service_provider"] as const;
const pinReasons = ["sponsored", "nearby", "most_watched", "featured_by_buyamia"] as const;
const replayStatuses = ["active", "expiring_soon", "expired"] as const;
const sortOptions = ["important", "featured", "most_viewed", "scheduled_desc", "scheduled_asc", "title_asc", "provider_asc", "replay_expiring"] as const;
const liveProviderInclude = {
  user: true,
  lives: { where: { status: "completed" }, select: { id: true } },
} satisfies Prisma.ProviderProfileInclude;

type LiveListStatus = (typeof liveStatuses)[number];
type SortOption = (typeof sortOptions)[number];

const featuredSupplierBuckets: {
  category: FeaturedSupplierCategory;
  badge: string;
  reason: string;
}[] = [
  {
    category: "Recommended",
    badge: "Curated",
    reason: "Selected from active supplier sessions and Buyamia-featured pins.",
  },
  {
    category: "Popular",
    badge: "Most watched",
    reason: "Pulled from supplier sessions with stored viewer or replay engagement.",
  },
  {
    category: "Nearby",
    badge: "Nearby",
    reason: "Uses supplier lives with a nearby pin when available.",
  },
  {
    category: "Sponsored",
    badge: "Sponsored",
    reason: "Uses supplier lives marked with sponsored placement when available.",
  },
  {
    category: "New verified suppliers",
    badge: "Verified",
    reason: "Highlights supplier sessions from verified provider accounts.",
  },
];

export type ListLivesInput = {
  page?: unknown;
  pageSize?: unknown;
  search?: unknown;
  status?: unknown;
  category?: unknown;
  providerRole?: unknown;
  providerId?: unknown;
  pinned?: unknown;
  pinReason?: unknown;
  replayStatus?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
  sort?: unknown;
};

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalString(value: unknown) {
  const current = firstValue(value);
  if (typeof current === "number" && Number.isFinite(current)) {
    return String(current);
  }
  return typeof current === "string" && current.trim() ? current.trim() : undefined;
}

function numberParam(value: unknown, fallback: number, max?: number) {
  const current = Number(optionalString(value));
  const next = Number.isFinite(current) && current > 0 ? Math.floor(current) : fallback;
  return max ? Math.min(next, max) : next;
}

function enumParam<T extends readonly string[]>(value: unknown, options: T): T[number] | undefined {
  const current = optionalString(value);
  return current && options.includes(current) ? current : undefined;
}

function dateParam(value: unknown) {
  const current = optionalString(value);
  if (!current) {
    return undefined;
  }
  const date = new Date(current);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationApiError({ date: "Please enter a valid date." });
  }
  return date;
}

function replayWhere(status: ReplayStatus, now: Date): Prisma.LiveWhereInput {
  if (status === "expired") {
    return { OR: [{ replayExpiresAt: null }, { replayExpiresAt: { lte: now } }] };
  }

  if (status === "expiring_soon") {
    return { replayExpiresAt: { gt: now, lte: datePlusDays(now, 2) } };
  }

  return { replayExpiresAt: { gt: datePlusDays(now, 2) } };
}

function statusWhere(status: LiveListStatus, now: Date): Prisma.LiveWhereInput {
  if (status === "replay") {
    return { status: "completed", replayExpiresAt: { gt: now } };
  }

  if (status === "expired") {
    return { status: "completed", OR: [{ replayExpiresAt: null }, { replayExpiresAt: { lte: now } }] };
  }

  return { status };
}

function activePinWhere(now: Date): Prisma.LiveWhereInput {
  return { isPinned: true, OR: [{ pinExpiresAt: null }, { pinExpiresAt: { gt: now } }] };
}

function inactivePinWhere(now: Date): Prisma.LiveWhereInput {
  return {
    OR: [
      { isPinned: false },
      { isPinned: true, pinExpiresAt: { lte: now } },
    ],
  };
}

function orderByForSort(sort: SortOption): Prisma.LiveOrderByWithRelationInput[] {
  if (sort === "scheduled_asc") {
    return [{ scheduledAt: "asc" }, { createdAt: "asc" }];
  }
  if (sort === "title_asc") {
    return [{ title: "asc" }, { scheduledAt: "desc" }];
  }
  if (sort === "provider_asc") {
    return [{ provider: { displayName: "asc" } }, { scheduledAt: "desc" }];
  }
  if (sort === "replay_expiring") {
    return [{ replayExpiresAt: "asc" }, { scheduledAt: "desc" }];
  }
  if (sort === "scheduled_desc") {
    return [{ scheduledAt: "desc" }, { createdAt: "desc" }];
  }

  return [{ isPinned: "desc" }, { priorityScore: "desc" }, { scheduledAt: "desc" }, { createdAt: "desc" }];
}

export function isPinActive(live: Pick<Live, "isPinned" | "pinExpiresAt">, now = new Date()) {
  return live.isPinned && (!live.pinExpiresAt || live.pinExpiresAt > now);
}

export function parseScheduledStreamDate(value: unknown, now = new Date()) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationApiError({ scheduledAt: scheduleStreamFieldMessages.scheduledAt });
  }

  const scheduledAt = new Date(value);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new ValidationApiError({ scheduledAt: scheduleStreamFieldMessages.scheduledAt });
  }

  if (scheduledAt <= now) {
    throw new ValidationApiError({ scheduledAt: scheduleStreamFieldMessages.scheduledAtPast });
  }

  return scheduledAt;
}

function parseScheduleStreamInput(input: unknown, now = new Date()) {
  const parsed = scheduleStreamSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  return {
    ...parsed.data,
    scheduledAt: parseScheduledStreamDate(parsed.data.scheduledAt, now),
  };
}

function transcriptForLive(live: Pick<Live, "id" | "title" | "category" | "transcript"> & { provider: Pick<ProviderProfile, "displayName"> }): ReplayTranscriptSegment[] {
  const stored = parseStoredTranscript(live.transcript);

  if (stored.length > 0) {
    return stored;
  }

  return createDemoTranscript({
    liveId: live.id,
    title: live.title,
    providerName: live.provider.displayName,
    category: live.category,
  });
}

function commerceDataForLive(
  live: Pick<Live, "id" | "title" | "category" | "commerceData"> & { provider: Pick<ProviderProfile, "displayName"> },
): LiveCommerceData {
  const stored = parseCommerceData(live.commerceData);
  if (stored) {
    return stored;
  }

  return createDemoCommerceData({
    title: live.title,
    providerName: live.provider.displayName,
    category: live.category,
  });
}

function specialistHostForLive(
  live: Pick<Live, "specialistHost" | "title" | "category"> & { provider: Pick<ProviderProfile, "displayName" | "category"> },
): SpecialistHost {
  const stored = parseSpecialistHost(live.specialistHost);
  if (stored) {
    return stored;
  }

  return createDemoSpecialistHost({
    providerName: live.provider.displayName,
    providerCategory: live.provider.category,
    category: live.category,
    title: live.title,
  });
}

function questionsForLive(
  live: Pick<Live, "id" | "intentQuestions" | "title" | "category"> & { provider: Pick<ProviderProfile, "displayName"> },
): LiveIntentQuestion[] {
  const stored = parseLiveQuestions(live.intentQuestions);
  if (stored.length > 0) {
    return stored;
  }

  return createDemoLiveQuestions({
    liveId: live.id,
    providerName: live.provider.displayName,
    title: live.title,
    category: live.category,
  });
}

function parseStoredTranscript(value: Prisma.JsonValue | null): ReplayTranscriptSegment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const timestamp = typeof item.timestamp === "string" ? item.timestamp : formatTranscriptTimestamp(Number(item.seconds) || index * 45);
    const seconds = typeof item.seconds === "number" ? item.seconds : secondsFromTimestamp(timestamp);
    const speaker = typeof item.speaker === "string" ? item.speaker : "Speaker";
    const text = typeof item.text === "string" ? item.text : "";
    const tags = Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is ReplayTranscriptTag => isTranscriptTag(tag))
      : undefined;

    if (!text.trim()) {
      return [];
    }

    return [{
      id: typeof item.id === "string" ? item.id : `segment-${index + 1}`,
      timestamp,
      seconds,
      speaker,
      text,
      tags,
    }];
  });
}

function parseCommerceData(value: Prisma.JsonValue | null): LiveCommerceData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const data = value as Record<string, unknown>;

  const summary = typeof data.summary === "string" ? data.summary : "";
  const products = Array.isArray(data.products)
    ? data.products.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return [];
        }
        const product = item as Record<string, unknown>;

        const name = typeof product.name === "string" ? product.name : "";
        const variant = typeof product.variant === "string" ? product.variant : "";
        const moq = typeof product.moq === "string" ? product.moq : "";
        const inventory = typeof product.inventory === "string" ? product.inventory : "";
        const shippingAvailability = typeof product.shippingAvailability === "string" ? product.shippingAvailability : "";
        const serviceAvailability = typeof product.serviceAvailability === "string" ? product.serviceAvailability : "";
        const policySummary = typeof product.policySummary === "string" ? product.policySummary : "";

        if (!name || !variant) {
          return [];
        }

        return [{
          name,
          variant,
          moq,
          inventory,
          promotion: typeof product.promotion === "string" ? product.promotion : undefined,
          shippingAvailability,
          serviceAvailability,
          policySummary,
        }];
      })
    : [];
  const policies = Array.isArray(data.policies)
    ? data.policies.filter((policy): policy is string => typeof policy === "string")
    : [];
  const serviceAvailability = Array.isArray(data.serviceAvailability)
    ? data.serviceAvailability.filter((entry): entry is string => typeof entry === "string")
    : [];
  const rawSchedule = data.schedule && typeof data.schedule === "object" && !Array.isArray(data.schedule)
    ? data.schedule as Record<string, unknown>
    : undefined;
  const schedule = rawSchedule
    ? {
        estimatedDurationMinutes: typeof rawSchedule.estimatedDurationMinutes === "number" ? rawSchedule.estimatedDurationMinutes : null,
        language: typeof rawSchedule.language === "string" ? rawSchedule.language : null,
        thumbnailUrl: typeof rawSchedule.thumbnailUrl === "string" ? rawSchedule.thumbnailUrl : null,
        visibility: rawSchedule.visibility === "private" ? "private" as const : "public" as const,
        providerType: providerRoles.includes(rawSchedule.providerType as (typeof providerRoles)[number])
          ? rawSchedule.providerType as (typeof providerRoles)[number]
          : undefined,
      }
    : undefined;

  if (!summary && products.length === 0 && !schedule) {
    return null;
  }

  return { summary, products, policies, serviceAvailability, schedule };
}

function parseSpecialistHost(value: Prisma.JsonValue | null): SpecialistHost | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const data = value as Record<string, unknown>;

  const hostType = typeof data.hostType === "string" ? data.hostType : "";
  const expertiseArea = typeof data.expertiseArea === "string" ? data.expertiseArea : "";
  const bio = typeof data.bio === "string" ? data.bio : "";
  const verified = data.verified === true;

  if (!hostType || !expertiseArea || !bio) {
    return null;
  }

  return {
    hostType: hostType as SpecialistHost["hostType"],
    expertiseArea,
    bio,
    verified,
  };
}

function parseLiveQuestions(value: Prisma.JsonValue | null): LiveIntentQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }
    const questionData = item as Record<string, unknown>;

    const question = typeof questionData.question === "string" ? questionData.question : "";
    const buyerName = typeof questionData.buyerName === "string" ? questionData.buyerName : "Viewer";
    const timestamp = typeof questionData.timestamp === "string" ? questionData.timestamp : formatTranscriptTimestamp(index * 45);
    const status = isQuestionStatus(questionData.status) ? questionData.status : "unanswered";
    const intentCategory = isIntentCategory(questionData.intentCategory) ? questionData.intentCategory : "availability";

    if (!question.trim()) {
      return [];
    }

    return [{
      id: typeof questionData.id === "string" ? questionData.id : `question-${index + 1}`,
      buyerName,
      question,
      timestamp,
      status,
      intentCategory,
    }];
  });
}

export function createDemoTranscript(input: {
  liveId: string;
  title: string;
  providerName: string;
  category: string;
}): ReplayTranscriptSegment[] {
  const productLabel =
    input.category === "supplier"
      ? "rattan lounge set"
      : input.category === "restaurant"
        ? "chef tasting package"
        : input.category === "hotel"
          ? "suite walkthrough"
          : "service package";
  const host = input.providerName;
  const base = [
    {
      seconds: 0,
      speaker: host,
      text: `Welcome to ${input.title}. We will cover the product story, proof points, MOQ, shipping, and RFQ next steps.`,
      tags: ["product"],
    },
    {
      seconds: 54,
      speaker: "Buyamia AI",
      text: `Key product focus detected: ${productLabel}. Buyers are saving this moment for the replay brief.`,
      tags: ["product"],
    },
    {
      seconds: 132,
      speaker: host,
      text: "Minimum order quantity can be mixed across the hero product and companion items for a consolidated quote.",
      tags: ["MOQ", "RFQ"],
    },
    {
      seconds: 218,
      speaker: host,
      text: "For shipping, we can quote FOB and CIF options with export packing, carton marks, and lead-time confirmation.",
      tags: ["shipping"],
    },
    {
      seconds: 301,
      speaker: "Buyer",
      text: "Can you show the finish quality, material thickness, and warranty proof before we request samples?",
      tags: ["quality"],
    },
    {
      seconds: 372,
      speaker: host,
      text: "Pricing depends on quantity tiers, cushion or packaging selections, and the final shipping route.",
      tags: ["pricing"],
    },
    {
      seconds: 463,
      speaker: "Buyamia AI",
      text: "RFQ draft is ready with product specs, MOQ split, shipping assumptions, pricing notes, and sample request fields.",
      tags: ["RFQ", "MOQ", "shipping", "pricing"],
    },
  ] satisfies Omit<ReplayTranscriptSegment, "id" | "timestamp">[];

  return base.map((segment, index) => ({
    id: `${input.liveId}-transcript-${index + 1}`,
    timestamp: formatTranscriptTimestamp(segment.seconds),
    ...segment,
  }));
}

export function createDemoCommerceData(input: {
  title: string;
  providerName: string;
  category: string;
}): LiveCommerceData {
  const productName =
    input.category === "supplier"
      ? "Rattan lounge collection"
      : input.category === "restaurant"
        ? "Chef tasting package"
        : input.category === "hotel"
          ? "Suite experience bundle"
          : "Service bundle";

  return {
    summary: `Structured commerce data for ${input.title} with product variants, MOQ, inventory, and service coverage.`,
    products: [
      {
        name: productName,
        variant: "Signature finish",
        moq: "MOQ 24",
        inventory: "42 sets ready",
        promotion: "Launch bundle: 8% off mixed orders",
        shippingAvailability: "FOB / CIF available",
        serviceAvailability: "Installation and sample coordination included",
        policySummary: "24-hour quote lock, mixed-container policy, and sample hold available.",
      },
      {
        name: `${input.providerName} companion item`,
        variant: "Export grade",
        moq: "MOQ 12",
        inventory: "18 units in stock",
        shippingAvailability: "Regional delivery only",
        serviceAvailability: "White-glove handling on request",
        policySummary: "Lead time confirmation required before reservation.",
      },
    ],
    policies: [
      "Sample hold window: 7 days",
      "Quote validity: 14 days",
      "Warranty: supplier-defined",
    ],
    serviceAvailability: [
      "Sample booking",
      "Shipping quote support",
      "Installation or setup coordination",
    ],
  };
}

export function createDemoSpecialistHost(input: {
  providerName: string;
  providerCategory: string;
  category: string;
  title: string;
}): SpecialistHost {
  const hostType = demoHostType(input.providerCategory, input.category);

  return {
    hostType,
    expertiseArea:
      hostType === "supplier host"
        ? "Factory proof, MOQ, and export packaging"
        : hostType === "procurement specialist"
          ? "Quote comparison and RFQ scoping"
          : hostType === "interior designer"
            ? "Finish selection and spatial fit"
            : hostType === "hospitality consultant"
              ? "Guest-ready service workflows"
              : hostType === "product expert"
                ? "Material and quality proof"
                : "Sourcing coordination and buyer follow-up",
    verified: true,
    bio: `${input.providerName} is presenting ${input.title} as a B2B specialist host, keeping the session focused on procurement proof and buyer intent.`,
  };
}

export function createDemoLiveQuestions(input: {
  liveId: string;
  providerName: string;
  title: string;
  category: string;
}): LiveIntentQuestion[] {
  const base = [
    {
      buyerName: "Aman Villas",
      question: "Can you split MOQ across chair and daybed items?",
      intentCategory: "MOQ",
      status: "answered",
    },
    {
      buyerName: "Villa Group",
      question: "What is the CIF Bali shipping estimate for export packing?",
      intentCategory: "shipping",
      status: "answered",
    },
    {
      buyerName: "Procurement Desk",
      question: "How does the finish compare with the premium rattan line?",
      intentCategory: "comparison",
      status: "unanswered",
    },
    {
      buyerName: "Hotel Buyer",
      question: "Is there a bundle discount if we request samples and the full set together?",
      intentCategory: "bundle_request",
      status: "escalated",
    },
    {
      buyerName: "Studio Lead",
      question: "Can you confirm warranty and lead time before we proceed?",
      intentCategory: "policy",
      status: "answered",
    },
  ] satisfies Omit<LiveIntentQuestion, "id" | "timestamp">[];

  return base.map((item, index) => ({
    id: `${input.liveId}-question-${index + 1}`,
    buyerName: item.buyerName,
    question: item.question,
    timestamp: formatTranscriptTimestamp(index * 67 + 18),
    intentCategory: item.intentCategory,
    status: item.status,
  }));
}

function demoHostType(providerCategory: string, liveCategory: string): SpecialistHost["hostType"] {
  if (providerCategory === "supplier") {
    return "supplier host";
  }
  if (providerCategory === "service_provider") {
    return "sourcing agent";
  }
  if (providerCategory === "restaurant") {
    return "hospitality consultant";
  }
  if (providerCategory === "hotel") {
    return "interior designer";
  }

  if (liveCategory.toLowerCase().includes("product")) {
    return "product expert";
  }

  return "procurement specialist";
}

function isTranscriptTag(value: unknown): value is ReplayTranscriptTag {
  return ["product", "MOQ", "shipping", "pricing", "quality", "RFQ"].includes(String(value));
}

function isQuestionStatus(value: unknown): value is LiveIntentQuestion["status"] {
  return ["unanswered", "answered", "escalated"].includes(String(value));
}

function isIntentCategory(value: unknown): value is LiveIntentCategory {
  return [
    "MOQ",
    "shipping",
    "pricing",
    "quality",
    "comparison",
    "hesitation",
    "rejection",
    "bundle_request",
    "availability",
    "policy",
  ].includes(String(value));
}

function secondsFromTimestamp(timestamp: string) {
  const parts = timestamp.split(":").map((part) => Number(part));

  if (parts.some((part) => !Number.isFinite(part))) {
    return 0;
  }

  return parts.reduce((total, part) => total * 60 + part, 0);
}

function formatTranscriptTimestamp(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function toLiveEvent(live: LiveWithProvider): LiveEvent {
  const replay = getReplayStatus(live.replayExpiresAt);
  const completedLiveSessions = live.provider.lives?.length ?? 0;
  const specialistHost = specialistHostForLive(live);
  const commerceData = commerceDataForLive(live);
  const intentQuestions = questionsForLive(live);

  return {
    id: live.id,
    providerId: live.providerId,
    providerName: live.provider.displayName,
    providerRole: live.provider.category as LiveEvent["providerRole"],
    title: live.title,
    category: live.category,
    status:
      live.status === "active"
        ? "live"
        : live.status === "completed"
          ? "replay"
          : "scheduled",
    startsAt: (live.scheduledAt ?? live.startedAt ?? live.createdAt).toISOString(),
    viewerCount: live.viewerCount,
    replayViews: live.replayViews,
    conversionIntent: live.conversionIntent,
    isPinned: isPinActive(live),
    pinReason: live.pinReason ?? undefined,
    pinExpiresAt: live.pinExpiresAt?.toISOString(),
    priorityScore: live.priorityScore,
    trustScore: calculateSupplierTrustScore(live.provider, completedLiveSessions),
    transcript: transcriptForLive(live),
    specialistHost,
    commerceData,
    intentQuestions,
    replay: {
      availableFrom: (live.endedAt ?? live.createdAt).toISOString(),
      expiresAt: live.replayExpiresAt?.toISOString() ?? "",
      daysRemaining: replay.daysRemaining,
      status: replay.status,
      extensionAvailable: true,
      extensionDays: defaultReplayAvailabilityDays,
      planLabel: "Replay extension",
      priceLabel: "Payment placeholder: not connected",
    },
  };
}

async function toLiveEventWithMetrics(live: LiveWithProvider): Promise<LiveEvent> {
  const [viewerCount, replayViews, intentCount] = await Promise.all([
    prisma.analyticsEvent.count({ where: { liveId: live.id, eventType: { in: ["live_viewed", "watched_live"] } } }),
    prisma.analyticsEvent.count({ where: { liveId: live.id, eventType: "replay_viewed" } }),
    prisma.analyticsEvent.count({ where: { liveId: live.id, eventType: { contains: "intent" } } }),
  ]);
  const event = toLiveEvent(live);

  return {
    ...event,
    viewerCount: Math.max(event.viewerCount, viewerCount),
    replayViews: Math.max(event.replayViews, replayViews),
    conversionIntent: Math.max(
      event.conversionIntent,
      viewerCount > 0 ? Math.min(100, Math.round((intentCount / viewerCount) * 100)) : 0,
    ),
  };
}

export function sortPinnedLives(input: LiveEvent[]) {
  return [...input].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return Number(b.isPinned) - Number(a.isPinned);
    }
    return b.priorityScore - a.priorityScore;
  });
}

export async function getLives(providerId?: string) {
  const lives = await prisma.live.findMany({
    where: providerId ? { providerId } : undefined,
    include: { provider: { include: liveProviderInclude } },
  });

  return sortPinnedLives(lives.map(toLiveEvent));
}

export async function createScheduledStream(providerId: string, input: unknown) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Provider not found.", 404);
  }

  const parsed = parseScheduleStreamInput(input);
  if (parsed.providerType && parsed.providerType !== provider.category) {
    throw new ValidationApiError({ providerType: scheduleStreamFieldMessages.providerType });
  }

  const duplicate = await prisma.live.findFirst({
    where: {
      providerId,
      status: "scheduled",
      title: parsed.title,
      scheduledAt: parsed.scheduledAt,
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ValidationApiError({ scheduledAt: scheduleStreamFieldMessages.duplicate });
  }

  const commerceData = {
    summary: parsed.description ?? "",
    products: [],
    policies: [],
    serviceAvailability: [],
    schedule: {
      estimatedDurationMinutes: parsed.estimatedDurationMinutes ?? null,
      language: parsed.language ?? null,
      thumbnailUrl: parsed.thumbnailUrl ?? null,
      visibility: parsed.visibility,
      providerType: provider.category,
    },
  } satisfies Prisma.InputJsonObject;

  const live = await prisma.live.create({
    data: {
      providerId,
      title: parsed.title,
      category: parsed.category,
      status: "scheduled",
      scheduledAt: parsed.scheduledAt,
      replayExpiresAt: datePlusDays(parsed.scheduledAt, defaultReplayAvailabilityDays),
      commerceData,
    },
    include: { provider: { include: liveProviderInclude } },
  });

  await createAnalyticsEvent({
    userId: provider.userId,
    providerId,
    liveId: live.id,
    eventType: "stream_scheduled",
    metadata: {
      scheduledAt: parsed.scheduledAt.toISOString(),
      source: "schedule_stream",
      estimatedDurationMinutes: parsed.estimatedDurationMinutes,
      language: parsed.language,
      visibility: parsed.visibility,
    },
  });

  return toLiveEvent(live);
}

export async function getLiveById(id: string) {
  const live = await prisma.live.findUnique({
    where: { id },
    include: { provider: { include: liveProviderInclude } },
  });

  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  return toLiveEvent(live);
}

export async function getLiveDetailsById(id: string) {
  const live = await prisma.live.findUnique({
    where: { id },
    include: { provider: { include: liveProviderInclude } },
  });

  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  return toLiveEventWithMetrics(live);
}

export async function getPinnedLives(providerId?: string) {
  return (await getLives(providerId)).filter((live) => live.isPinned);
}

export async function getAdminLivePreview(limit = 3) {
  const lives = await prisma.live.findMany({
    include: { provider: { include: liveProviderInclude } },
  });
  const events = await Promise.all(lives.map(toLiveEventWithMetrics));

  return events.sort(compareLivePreviewPriority).slice(0, Math.max(0, limit));
}

function compareLivePreviewPriority(a: LiveEvent, b: LiveEvent) {
  const rank = (live: LiveEvent) => {
    if (live.isPinned) return 0;
    if (live.status === "live") return 1;
    if (live.status === "scheduled") return 2;
    return 3;
  };
  const rankDelta = rank(a) - rank(b);
  if (rankDelta !== 0) return rankDelta;

  const priorityDelta = b.priorityScore - a.priorityScore;
  if (priorityDelta !== 0) return priorityDelta;

  const engagementDelta = (b.viewerCount + b.replayViews) - (a.viewerCount + a.replayViews);
  if (engagementDelta !== 0) return engagementDelta;

  return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
}

export async function getFeaturedSupplierSessions(): Promise<FeaturedSupplierSession[]> {
  const lives = await prisma.live.findMany({
    where: { provider: { category: "supplier" } },
    include: { provider: { include: liveProviderInclude } },
    orderBy: [
      { isPinned: "desc" },
      { priorityScore: "desc" },
      { scheduledAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 12,
  });

  const records = await Promise.all(
    lives.map(async (live) => ({
      live,
      event: await toLiveEventWithMetrics(live),
    })),
  );

  if (records.length === 0) {
    return [];
  }

  const usedIds = new Set<string>();
  const pick = (category: FeaturedSupplierCategory, index: number) => {
    const unused = (record: (typeof records)[number]) => !usedIds.has(record.event.id);
    const available = records.filter(unused);
    const pool = available.length ? available : records;

    if (category === "Sponsored") {
      return pool.find((record) => record.event.pinReason === "sponsored") ?? pool[index % pool.length];
    }

    if (category === "Nearby") {
      return pool.find((record) => record.event.pinReason === "nearby") ?? pool[index % pool.length];
    }

    if (category === "Popular") {
      return [...pool].sort(
        (a, b) =>
          b.event.viewerCount +
          b.event.replayViews -
          (a.event.viewerCount + a.event.replayViews),
      )[0];
    }

    if (category === "New verified suppliers") {
      return (
        pool.find((record) => record.live.provider.user.verificationStatus === "verified") ??
        pool[index % pool.length]
      );
    }

    return (
      pool.find((record) => record.event.pinReason === "featured_by_buyamia") ??
      pool[0]
    );
  };

  return featuredSupplierBuckets.map((bucket, index) => {
    const record = pick(bucket.category, index);
    usedIds.add(record.event.id);

    return {
      ...record.event,
      featureCategory: bucket.category,
      featureReason: bucket.reason,
      featureBadge: bucket.badge,
    };
  });
}

export async function listLives(input: ListLivesInput = {}): Promise<LiveListResponse> {
  const now = new Date();
  const page = numberParam(input.page, 1);
  const pageSize = numberParam(input.pageSize, 10, 50);
  const search = optionalString(input.search);
  const status = enumParam(input.status, liveStatuses);
  const providerRole = enumParam(input.providerRole, providerRoles);
  const pinReason = enumParam(input.pinReason, pinReasons) as PinReason | undefined;
  const replayStatus = enumParam(input.replayStatus, replayStatuses) as ReplayStatus | undefined;
  const sort = enumParam(input.sort, sortOptions) ?? "important";
  const dateFrom = dateParam(input.dateFrom);
  const dateTo = dateParam(input.dateTo);
  const category = optionalString(input.category);
  const providerId = optionalString(input.providerId);
  const pinned = optionalString(input.pinned);
  const whereParts: Prisma.LiveWhereInput[] = [];

  if (search) {
    whereParts.push({
      OR: [
        { title: { contains: search } },
        { provider: { displayName: { contains: search } } },
        { provider: { user: { name: { contains: search } } } },
      ],
    });
  }
  if (status) {
    whereParts.push(statusWhere(status, now));
  }
  if (category) {
    whereParts.push({ category });
  }
  if (providerRole) {
    whereParts.push({ provider: { category: providerRole } });
  }
  if (providerId) {
    whereParts.push({ providerId });
  }
  if (pinned === "pinned" || pinned === "true") {
    whereParts.push(activePinWhere(now));
  }
  if (pinned === "not_pinned" || pinned === "false") {
    whereParts.push(inactivePinWhere(now));
  }
  if (pinReason) {
    whereParts.push({ pinReason });
  }
  if (replayStatus) {
    whereParts.push(replayWhere(replayStatus, now));
  }
  if (dateFrom || dateTo) {
    const range: Prisma.DateTimeFilter = {
      gte: dateFrom,
      lte: dateTo,
    };
    whereParts.push({
      OR: [
        { scheduledAt: range },
        { startedAt: range },
        { endedAt: range },
        { createdAt: range },
      ],
    });
  }

  const where: Prisma.LiveWhereInput = whereParts.length ? { AND: whereParts } : {};
  if (sort === "most_viewed") {
    const [totalItems, activePinnedCount, lives] = await Promise.all([
      prisma.live.count({ where }),
      prisma.live.count({ where: activePinWhere(now) }),
      prisma.live.findMany({
        where,
        include: { provider: { include: liveProviderInclude } },
      }),
    ]);
    const ranked = (await Promise.all(lives.map(toLiveEventWithMetrics)))
      .sort((a, b) => (b.viewerCount + b.replayViews) - (a.viewerCount + a.replayViews));
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items: ranked.slice((page - 1) * pageSize, page * pageSize),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
      activePinnedCount,
    };
  }

  const [totalItems, activePinnedCount, lives] = await Promise.all([
    prisma.live.count({ where }),
    prisma.live.count({ where: activePinWhere(now) }),
    prisma.live.findMany({
      where,
      include: { provider: { include: liveProviderInclude } },
      orderBy: orderByForSort(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: await Promise.all(lives.map(toLiveEventWithMetrics)),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
    activePinnedCount,
  };
}

export async function extendReplayAvailability(input: {
  liveId: string;
  extensionDays?: unknown;
  adminId?: string;
}) {
  const parsed = replaySchema.parse(input);
  const live = await prisma.live.findUnique({ where: { id: input.liveId } });
  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  const baseDate =
    live.replayExpiresAt && live.replayExpiresAt > new Date()
      ? live.replayExpiresAt
      : new Date();
  const updated = await prisma.live.update({
    where: { id: input.liveId },
    data: { replayExpiresAt: datePlusDays(baseDate, parsed.extensionDays) },
    include: { provider: { include: liveProviderInclude } },
  });

  await createAnalyticsEvent({
    providerId: updated.providerId,
    liveId: updated.id,
    eventType: "replay_extended",
    metadata: { extensionDays: parsed.extensionDays },
  });

  if (input.adminId) {
    await prisma.adminActivity.create({
      data: {
        adminId: input.adminId,
        action: "replay_extended",
        targetType: "live",
        targetId: updated.id,
        message: `Extended replay by ${parsed.extensionDays} days.`,
      },
    });
  }

  return toLiveEvent(updated);
}

export async function listProviderReplays(providerId: string, input: {
  replayStatus?: unknown;
  availability?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  category?: unknown;
  sort?: unknown;
} = {}) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Provider not found.", 404);
  }
  if (provider.category !== "service_provider") {
    throw new ApiError("forbidden", "Only service providers can manage replay availability.", 403);
  }

  const now = new Date();
  const replayStatus = enumParam(input.replayStatus, replayStatuses) as ReplayStatus | undefined;
  const availability = optionalString(input.availability);
  const createdAt = dateParam(input.createdAt);
  const expiresAt = dateParam(input.expiresAt);
  const category = optionalString(input.category);
  const sort = enumParam(input.sort, ["newest", "oldest", "expiring_soon", "most_viewed"] as const) ?? "expiring_soon";
  const whereParts: Prisma.LiveWhereInput[] = [{ providerId, status: "completed" }];

  if (replayStatus) {
    whereParts.push(replayWhere(replayStatus, now));
  }
  if (availability === "available") {
    whereParts.push({ replayExpiresAt: { gt: now } });
  }
  if (availability === "expired") {
    whereParts.push({ OR: [{ replayExpiresAt: null }, { replayExpiresAt: { lte: now } }] });
  }
  if (createdAt) {
    whereParts.push({ createdAt: { gte: new Date(createdAt.toDateString()), lt: datePlusDays(new Date(createdAt.toDateString()), 1) } });
  }
  if (expiresAt) {
    whereParts.push({ replayExpiresAt: { gte: new Date(expiresAt.toDateString()), lt: datePlusDays(new Date(expiresAt.toDateString()), 1) } });
  }
  if (category) {
    whereParts.push({ category });
  }

  const lives = await prisma.live.findMany({
    where: { AND: whereParts },
    include: { provider: { include: liveProviderInclude } },
    orderBy:
      sort === "oldest"
        ? [{ createdAt: "asc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ replayExpiresAt: "asc" }, { createdAt: "desc" }],
  });
  const events = await Promise.all(lives.map(toLiveEventWithMetrics));
  return sort === "most_viewed"
    ? events.sort((a, b) => b.replayViews - a.replayViews)
    : events;
}

export async function updateProviderReplayAvailability(providerId: string, liveId: string, input: unknown) {
  const parsed = providerReplaySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const live = await prisma.live.findFirst({
    where: { id: liveId, providerId, status: "completed" },
    include: { provider: { include: liveProviderInclude } },
  });
  if (!live) {
    throw new ApiError("not_found", "Replay not found.", 404);
  }
  if (live.provider.category !== "service_provider") {
    throw new ApiError("forbidden", "Only service providers can manage replay availability.", 403);
  }

  const commerceData = live.commerceData && typeof live.commerceData === "object" && !Array.isArray(live.commerceData)
    ? { ...(live.commerceData as Prisma.JsonObject) }
    : {};
  const schedule = commerceData.schedule && typeof commerceData.schedule === "object" && !Array.isArray(commerceData.schedule)
    ? { ...(commerceData.schedule as Prisma.JsonObject) }
    : {};
  if (parsed.data.visibility) {
    schedule.visibility = parsed.data.visibility;
    commerceData.schedule = schedule;
  }

  const replayExpiresAt = parsed.data.removeExpiration
    ? null
    : parsed.data.expirationDate
      ? new Date(`${parsed.data.expirationDate}T23:59:59`)
      : live.replayExpiresAt;

  const updated = await prisma.live.update({
    where: { id: live.id },
    data: {
      replayExpiresAt,
      commerceData: commerceData as Prisma.InputJsonValue,
    },
    include: { provider: { include: liveProviderInclude } },
  });

  await createAnalyticsEvent({
    providerId: updated.providerId,
    liveId: updated.id,
    eventType: parsed.data.visibility ? "replay_visibility_updated" : "replay_extended",
    metadata: {
      replayExpiresAt: updated.replayExpiresAt?.toISOString() ?? "none",
      visibility: parsed.data.visibility ?? "",
    },
  });

  return toLiveEvent(updated);
}

export async function updateLivePin(input: {
  liveId: string;
  isPinned: unknown;
  pinReason?: unknown;
  pinExpiresAt?: unknown;
  priorityScore?: unknown;
  adminId?: string;
}) {
  const parsed = pinSchema.parse(input);
  const live = await prisma.live.findUnique({ where: { id: input.liveId } });
  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  const updated = await prisma.live.update({
    where: { id: input.liveId },
    data: parsed.isPinned
      ? {
          isPinned: true,
          pinReason: parsed.pinReason ?? "featured_by_buyamia",
          pinExpiresAt: parsed.pinExpiresAt ? new Date(parsed.pinExpiresAt) : datePlusDays(new Date(), 5),
          priorityScore: parsed.priorityScore ?? Math.max(live.priorityScore, 100),
        }
      : {
          isPinned: false,
          pinReason: null,
          pinExpiresAt: null,
          priorityScore: 0,
        },
    include: { provider: { include: liveProviderInclude } },
  });

  await createAnalyticsEvent({
    providerId: updated.providerId,
    liveId: updated.id,
    eventType: parsed.isPinned ? "live_pinned" : "live_unpinned",
    metadata: parsed.pinReason ? { pinReason: parsed.pinReason } : undefined,
  });

  if (input.adminId) {
    await prisma.adminActivity.create({
      data: {
        adminId: input.adminId,
        action: parsed.isPinned ? "live_pinned" : "live_unpinned",
        targetType: "live",
        targetId: updated.id,
        message: parsed.isPinned ? "Pinned live." : "Unpinned live.",
      },
    });
  }

  return toLiveEvent(updated);
}
