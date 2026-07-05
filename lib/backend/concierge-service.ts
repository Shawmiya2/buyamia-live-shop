import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";
import { getLastMileAdapterRoadmap } from "./last-mile-adapters";
import type { SafeUser } from "./types";

const requestStatuses = [
  "open",
  "in_progress",
  "waiting_for_buyer",
  "waiting_for_provider",
  "arranged",
  "completed",
  "cancelled",
] as const;

const actionStatuses = ["pending", "completed", "blocked"] as const;

const updateRequestSchema = z.object({
  status: z.enum(requestStatuses).optional(),
  conciergeNote: z.string().trim().max(2000).optional(),
  actionId: z.string().trim().optional(),
  actionStatus: z.enum(actionStatuses).optional(),
  outcomeStatus: z.enum(["pending", "arranged", "fulfilled", "failed"]).optional(),
  outcomeSummary: z.string().trim().max(2000).optional(),
});

type IntentForAgent = Prisma.BuyerIntentGetPayload<{
  include: {
    address: true;
    live: { select: { id: true; title: true; category: true } };
    provider: { select: { id: true; displayName: true; category: true } };
    conciergeRequests: true;
    outcomes: true;
  };
}>;

const conciergeInclude = {
  actions: { orderBy: { createdAt: "asc" } },
  buyerIntent: {
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      address: true,
      live: { select: { id: true, title: true, category: true } },
      provider: { select: { id: true, displayName: true, category: true } },
      outcomes: { orderBy: { createdAt: "asc" } },
    },
  },
} satisfies Prisma.ConciergeRequestInclude;

export type ConciergeRequestRecord = Prisma.ConciergeRequestGetPayload<{
  include: typeof conciergeInclude;
}>;

export function runBuyamiaConciergeAgent(intent: IntentForAgent) {
  const requestedServices = classifyRequestedServices(intent);
  const hasAddress = Boolean(intent.addressId && intent.address);
  const needsProvider = Boolean(intent.providerId || intent.liveId);
  const actions: { actionType: Prisma.ConciergeActionCreateWithoutConciergeRequestInput["actionType"]; note: string }[] = [];

  if (!hasAddress && requiresAddress(intent.intentType)) {
    actions.push({
      actionType: "request_address",
      note: "Buyer address is required before Buyamia can arrange delivery, booking, or local service handoff.",
    });
  }

  actions.push({
    actionType: "contact_buyer",
    note: `Confirm ${intent.productOrServiceName}, urgency, quantity, and preferred contact channel.`,
  });

  if (needsProvider) {
    actions.push({
      actionType: "contact_provider",
      note: "Confirm provider availability, final product/service details, and any last-mile constraints.",
    });
  }

  if (requestedServices.includes("delivery")) {
    actions.push({
      actionType: "arrange_delivery",
      note: "Demo only: a logistics provider will be needed later to quote and schedule delivery.",
    });
  }

  if (requestedServices.includes("booking")) {
    actions.push({
      actionType: "arrange_booking",
      note: "Demo only: a booking provider or provider-owned calendar will be needed later.",
    });
  }

  if (requestedServices.includes("payment")) {
    actions.push({
      actionType: "request_payment_provider",
      note: "Demo only: payment provider is not configured and no payment will be collected.",
    });
  }

  if (requestedServices.includes("insurance")) {
    actions.push({
      actionType: "request_insurance_provider",
      note: "Demo only: insurance provider is not configured for protected fulfilment.",
    });
  }

  const status = hasAddress || !requiresAddress(intent.intentType) ? "open" : "waiting_for_buyer";
  const outcomeType =
    intent.intentType === "book_service"
      ? "service_booking"
      : intent.intentType === "request_quote" || intent.intentType === "ask_question"
        ? "quote_request"
        : intent.intentType === "buy_product"
          ? "product_sale"
          : "concierge_arrangement";

  return {
    status,
    requestedServices,
    actions,
    outcomeType,
    note: [
      `Buyamia Concierge classified this as ${intent.intentType.replace(/_/g, " ")}.`,
      hasAddress ? "Address context is available for authorized concierge handling." : "Address context is missing or not required yet.",
      `External providers needed later: ${providerExplanation(requestedServices)}.`,
    ].join(" "),
    outcomeSummary: `Pending concierge arrangement for ${intent.productOrServiceName}. No payment, shipment, insurance, or third-party booking has been created.`,
  } as const;
}

export async function createConciergeRequestForIntent(buyerIntentId: string) {
  const existing = await prisma.conciergeRequest.findFirst({
    where: { buyerIntentId },
    include: conciergeInclude,
  });
  if (existing) {
    return toConciergeRequestDto(existing, "admin");
  }

  const intent = await prisma.buyerIntent.findUnique({
    where: { id: buyerIntentId },
    include: {
      address: true,
      live: { select: { id: true, title: true, category: true } },
      provider: { select: { id: true, displayName: true, category: true } },
      conciergeRequests: true,
      outcomes: true,
    },
  });
  if (!intent) {
    throw new ApiError("not_found", "Buyer intent not found.", 404);
  }

  const agent = runBuyamiaConciergeAgent(intent);
  const request = await prisma.$transaction(async (tx) => {
    await tx.buyerIntent.update({
      where: { id: intent.id },
      data: { status: agent.status === "waiting_for_buyer" ? "qualifying" : "concierge_review" },
    });

    const created = await tx.conciergeRequest.create({
      data: {
        buyerIntentId: intent.id,
        assignedAgentName: "Buyamia Concierge",
        status: agent.status,
        requestedServices: agent.requestedServices as Prisma.InputJsonValue,
        conciergeNote: agent.note,
        actions: {
          create: agent.actions.map((action) => ({
            actionType: action.actionType,
            status: "pending",
            note: action.note,
          })),
        },
      },
    });

    await tx.outcome.create({
      data: {
        buyerIntentId: intent.id,
        status: "pending",
        outcomeType: agent.outcomeType,
        summary: agent.outcomeSummary,
      },
    });

    return tx.conciergeRequest.findUniqueOrThrow({
      where: { id: created.id },
      include: conciergeInclude,
    });
  });

  return toConciergeRequestDto(request, "admin");
}

export async function listConciergeRequestsForUser(user: SafeUser) {
  if (user.role === "main_admin") {
    const requests = await prisma.conciergeRequest.findMany({
      include: conciergeInclude,
      orderBy: { createdAt: "desc" },
    });
    return requests.map((request) => toConciergeRequestDto(request, "admin"));
  }

  if (user.role === "viewer") {
    const requests = await prisma.conciergeRequest.findMany({
      where: { buyerIntent: { buyerId: user.id } },
      include: conciergeInclude,
      orderBy: { createdAt: "desc" },
    });
    return requests.map((request) => toConciergeRequestDto(request, "buyer"));
  }

  if (user.providerId) {
    const requests = await prisma.conciergeRequest.findMany({
      where: { buyerIntent: { providerId: user.providerId } },
      include: conciergeInclude,
      orderBy: { createdAt: "desc" },
    });
    return requests.map((request) => toConciergeRequestDto(request, "provider"));
  }

  throw new ApiError("forbidden", "You are not allowed to view concierge requests.", 403);
}

export async function getConciergeRequestForUser(id: string, user: SafeUser) {
  const request = await prisma.conciergeRequest.findUnique({
    where: { id },
    include: conciergeInclude,
  });
  if (!request) {
    throw new ApiError("not_found", "Concierge request not found.", 404);
  }

  const scope = requestScopeForUser(request, user);
  if (!scope) {
    throw new ApiError("forbidden", "You are not allowed to view this concierge request.", 403);
  }

  return toConciergeRequestDto(request, scope);
}

export async function updateConciergeRequest(id: string, user: SafeUser, input: unknown) {
  if (user.role !== "main_admin") {
    throw new ApiError("forbidden", "Only main admins can manage concierge requests.", 403);
  }

  const parsed = updateRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const request = await prisma.conciergeRequest.findUnique({
    where: { id },
    include: conciergeInclude,
  });
  if (!request) {
    throw new ApiError("not_found", "Concierge request not found.", 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.actionId && parsed.data.actionStatus) {
      const action = request.actions.find((item) => item.id === parsed.data.actionId);
      if (!action) {
        throw new ApiError("not_found", "Concierge action not found.", 404);
      }
      await tx.conciergeAction.update({
        where: { id: parsed.data.actionId },
        data: { status: parsed.data.actionStatus },
      });
    }

    if (parsed.data.outcomeStatus || parsed.data.outcomeSummary) {
      const outcome = request.buyerIntent.outcomes[0];
      if (outcome) {
        await tx.outcome.update({
          where: { id: outcome.id },
          data: {
            status: parsed.data.outcomeStatus,
            summary: parsed.data.outcomeSummary,
          },
        });
      }
    }

    return tx.conciergeRequest.update({
      where: { id },
      data: {
        status: parsed.data.status,
        conciergeNote: parsed.data.conciergeNote,
      },
      include: conciergeInclude,
    });
  });

  return toConciergeRequestDto(updated, "admin");
}

export async function getConciergeRoadmap() {
  const [openRequests, waitingForBuyer, waitingForProvider, arrangedOutcomes] = await Promise.all([
    prisma.conciergeRequest.count({ where: { status: "open" } }),
    prisma.conciergeRequest.count({ where: { status: "waiting_for_buyer" } }),
    prisma.conciergeRequest.count({ where: { status: "waiting_for_provider" } }),
    prisma.outcome.count({ where: { status: "arranged" } }),
  ]);

  return {
    ideas: [
      {
        title: "Remote account bot",
        summary: "WhatsApp and Telegram style account commands for providers and viewers.",
      },
      {
        title: "Presenter tools",
        summary: "Live product cards, prompts, polls, countdowns, and trust badges.",
      },
      {
        title: "Ambassador trusted layer",
        summary: "Viewer sharing, referrals, trusted community activity, and reward ledgers.",
      },
      {
        title: "Last-mile concierge",
        summary: "One Buyamia Concierge agent captures buyer intent and coordinates local outcomes.",
      },
    ],
    conciergeSummary: {
      openRequests,
      waitingForBuyer,
      waitingForProvider,
      arrangedOutcomes,
    },
    adapters: getLastMileAdapterRoadmap(),
  };
}

export async function getConciergeAdminSummary() {
  const [openRequests, waitingForBuyer, waitingForProvider, arrangedOutcomes] = await Promise.all([
    prisma.conciergeRequest.count({ where: { status: "open" } }),
    prisma.conciergeRequest.count({ where: { status: "waiting_for_buyer" } }),
    prisma.conciergeRequest.count({ where: { status: "waiting_for_provider" } }),
    prisma.outcome.count({ where: { status: "arranged" } }),
  ]);

  return { openRequests, waitingForBuyer, waitingForProvider, arrangedOutcomes };
}

function requestScopeForUser(request: ConciergeRequestRecord, user: SafeUser): "admin" | "buyer" | "provider" | null {
  if (user.role === "main_admin") {
    return "admin";
  }
  if (user.role === "viewer" && request.buyerIntent.buyerId === user.id) {
    return "buyer";
  }
  if (user.providerId && request.buyerIntent.providerId === user.providerId) {
    return "provider";
  }
  return null;
}

function classifyRequestedServices(intent: Pick<IntentForAgent, "intentType" | "category" | "notes">) {
  const haystack = `${intent.intentType} ${intent.category} ${intent.notes}`.toLowerCase();
  const services = new Set<string>(["concierge"]);

  if (/deliver|shipping|ship|wallet|phone|product|sale|buy/.test(haystack)) {
    services.add("delivery");
    services.add("payment");
  }
  if (/book|reservation|service|hotel|restaurant|table|appointment/.test(haystack)) {
    services.add("booking");
  }
  if (/insurance|insured|cover|protection/.test(haystack)) {
    services.add("insurance");
  }
  if (/quote|rfq|pricing|price/.test(haystack)) {
    services.add("quote");
  }

  return [...services];
}

function requiresAddress(intentType: string) {
  return ["buy_product", "book_service", "arrange_delivery", "request_concierge"].includes(intentType);
}

function providerExplanation(services: string[]) {
  const needed = [];
  if (services.includes("delivery")) needed.push("delivery/logistics");
  if (services.includes("payment")) needed.push("payment");
  if (services.includes("insurance")) needed.push("insurance");
  if (services.includes("booking")) needed.push("booking/calendar");
  needed.push("livestream event handoff");
  return needed.join(", ");
}

export function toConciergeRequestDto(request: ConciergeRequestRecord, scope: "admin" | "buyer" | "provider") {
  const address = scope === "admin" || scope === "buyer" ? request.buyerIntent.address : null;

  return {
    id: request.id,
    buyerIntentId: request.buyerIntentId,
    assignedAgentName: request.assignedAgentName,
    status: request.status,
    requestedServices: Array.isArray(request.requestedServices) ? request.requestedServices : [],
    conciergeNote: request.conciergeNote,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    actions: request.actions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      status: action.status,
      note: action.note,
      createdAt: action.createdAt.toISOString(),
    })),
    buyerIntent: {
      id: request.buyerIntent.id,
      buyerId: request.buyerIntent.buyerId,
      buyerName: scope === "admin" ? request.buyerIntent.buyer.name : undefined,
      liveId: request.buyerIntent.liveId,
      liveTitle: request.buyerIntent.live?.title ?? null,
      providerId: request.buyerIntent.providerId,
      providerName: request.buyerIntent.provider?.displayName ?? null,
      productOrServiceName: request.buyerIntent.productOrServiceName,
      category: request.buyerIntent.category,
      intentType: request.buyerIntent.intentType,
      urgency: request.buyerIntent.urgency,
      status: request.buyerIntent.status,
      notes: request.buyerIntent.notes,
      address: address
        ? {
            id: address.id,
            label: address.label,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            region: address.region,
            country: address.country,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
          }
        : null,
      outcomes: request.buyerIntent.outcomes.map((outcome) => ({
        id: outcome.id,
        status: outcome.status,
        outcomeType: outcome.outcomeType,
        summary: outcome.summary,
        createdAt: outcome.createdAt.toISOString(),
        updatedAt: outcome.updatedAt.toISOString(),
      })),
    },
  };
}
