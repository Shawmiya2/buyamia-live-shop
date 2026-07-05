import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";
import { createConciergeRequestForIntent } from "./concierge-service";
import type { SafeUser } from "./types";

const intentTypes = [
  "buy_product",
  "book_service",
  "request_quote",
  "arrange_delivery",
  "request_concierge",
  "ask_question",
] as const;
const urgencies = ["today", "this_week", "flexible"] as const;
const intentStatuses = [
  "captured",
  "qualifying",
  "concierge_review",
  "arranged",
  "completed",
  "cancelled",
] as const;
const contactMethods = ["platform", "whatsapp", "telegram", "email"] as const;

function requiredString(message: string, max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().min(1, message).max(max),
  );
}

const addressSchema = z.object({
  label: z.string().trim().min(1, "Please enter an address label.").max(80),
  line1: z.string().trim().min(1, "Please enter address line 1.").max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1, "Please enter a city.").max(80),
  region: z.string().trim().max(80).optional(),
  country: z.string().trim().min(1, "Please enter a country.").max(80),
  postalCode: z.string().trim().max(40).optional(),
  isDefault: z.boolean().optional(),
});

const createIntentSchema = z.object({
  liveId: z.string().trim().optional(),
  providerId: z.string().trim().optional(),
  productOrServiceName: requiredString("Please enter a product or service name.", 160),
  category: requiredString("Please enter a category.", 80),
  intentType: z.enum(intentTypes),
  quantity: z.coerce.number().int().positive().max(100000).optional(),
  budgetLabel: z.string().trim().max(80).optional(),
  urgency: z.enum(urgencies).default("flexible"),
  addressId: z.string().trim().optional(),
  address: addressSchema.optional(),
  notes: z.string().trim().max(2000).default(""),
  displayName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  preferredContactMethod: z.enum(contactMethods).default("platform"),
}).superRefine((value, context) => {
  if (value.addressId && value.address) {
    context.addIssue({
      code: "custom",
      path: ["addressId"],
      message: "Choose a saved address or enter a new address, not both.",
    });
  }
});

const updateIntentSchema = z.object({
  status: z.enum(intentStatuses).optional(),
  notes: z.string().trim().max(2000).optional(),
  addressId: z.string().trim().optional(),
  address: addressSchema.optional(),
});

const intentInclude = {
  address: true,
  live: { select: { id: true, title: true, category: true, providerId: true } },
  provider: { select: { id: true, displayName: true, category: true } },
  conciergeRequests: {
    include: { actions: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  },
  outcomes: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.BuyerIntentInclude;

type BuyerIntentRecord = Prisma.BuyerIntentGetPayload<{ include: typeof intentInclude }>;

export async function getBuyerProfileForUser(user: SafeUser) {
  if (user.role !== "viewer") {
    throw new ApiError("forbidden", "Only viewers have buyer profiles.", 403);
  }

  const profile = await prisma.buyerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      displayName: user.name,
      preferredContactMethod: "platform",
    },
  });
  const addresses = await prisma.buyerAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      phone: profile.phone,
      preferredContactMethod: profile.preferredContactMethod,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    },
    addresses: addresses.map(toAddressDto),
  };
}

export async function createBuyerIntent(user: SafeUser, input: unknown) {
  if (user.role !== "viewer") {
    throw new ApiError("forbidden", "Only viewers can create buyer intents.", 403);
  }

  const parsed = createIntentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const live = parsed.data.liveId
    ? await prisma.live.findUnique({ where: { id: parsed.data.liveId }, select: { id: true, providerId: true } })
    : null;
  if (parsed.data.liveId && !live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }
  const providerId = parsed.data.providerId ?? live?.providerId;
  if (providerId) {
    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { id: true } });
    if (!provider) {
      throw new ApiError("not_found", "Provider not found.", 404);
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    await tx.buyerProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: parsed.data.displayName || user.name,
        phone: parsed.data.phone || undefined,
        preferredContactMethod: parsed.data.preferredContactMethod,
      },
      create: {
        userId: user.id,
        displayName: parsed.data.displayName || user.name,
        phone: parsed.data.phone,
        preferredContactMethod: parsed.data.preferredContactMethod,
      },
    });

    const addressId = parsed.data.address
      ? await createAddressInTransaction(tx, user.id, parsed.data.address)
      : parsed.data.addressId
        ? await assertOwnAddress(tx, user.id, parsed.data.addressId)
        : undefined;

    const intent = await tx.buyerIntent.create({
      data: {
        buyerId: user.id,
        liveId: live?.id,
        providerId,
        productOrServiceName: parsed.data.productOrServiceName,
        category: parsed.data.category,
        intentType: parsed.data.intentType,
        quantity: parsed.data.quantity,
        budgetLabel: parsed.data.budgetLabel || undefined,
        urgency: parsed.data.urgency,
        status: "captured",
        addressId,
        notes: parsed.data.notes,
      },
      include: intentInclude,
    });

    return intent;
  });

  await createConciergeRequestForIntent(created.id);

  return getBuyerIntentForUser(created.id, user);
}

export async function listBuyerIntentsForUser(user: SafeUser) {
  const where =
    user.role === "main_admin"
      ? {}
      : user.role === "viewer"
        ? { buyerId: user.id }
        : user.providerId
          ? { providerId: user.providerId }
          : null;

  if (!where) {
    throw new ApiError("forbidden", "You are not allowed to view buyer intents.", 403);
  }

  const intents = await prisma.buyerIntent.findMany({
    where,
    include: intentInclude,
    orderBy: { createdAt: "desc" },
  });

  return intents.map((intent) => toBuyerIntentDto(intent, scopeForUser(intent, user)));
}

export async function getBuyerIntentForUser(id: string, user: SafeUser) {
  const intent = await prisma.buyerIntent.findUnique({
    where: { id },
    include: intentInclude,
  });
  if (!intent) {
    throw new ApiError("not_found", "Buyer intent not found.", 404);
  }

  const scope = scopeForUser(intent, user);
  if (!scope) {
    throw new ApiError("forbidden", "You are not allowed to view this buyer intent.", 403);
  }

  return toBuyerIntentDto(intent, scope);
}

export async function updateBuyerIntent(id: string, user: SafeUser, input: unknown) {
  const intent = await prisma.buyerIntent.findUnique({ where: { id }, include: intentInclude });
  if (!intent) {
    throw new ApiError("not_found", "Buyer intent not found.", 404);
  }

  const scope = scopeForUser(intent, user);
  if (!scope) {
    throw new ApiError("forbidden", "You are not allowed to update this buyer intent.", 403);
  }

  const parsed = updateIntentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  if (scope !== "admin" && parsed.data.status) {
    throw new ApiError("forbidden", "Only main admins can update buyer intent status.", 403);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const addressId = parsed.data.address
      ? await createAddressInTransaction(tx, intent.buyerId, parsed.data.address)
      : parsed.data.addressId
        ? await assertOwnAddress(tx, intent.buyerId, parsed.data.addressId)
        : undefined;

    return tx.buyerIntent.update({
      where: { id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes,
        addressId,
      },
      include: intentInclude,
    });
  });

  return toBuyerIntentDto(updated, scopeForUser(updated, user));
}

async function createAddressInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  input: z.infer<typeof addressSchema>,
) {
  if (input.isDefault) {
    await tx.buyerAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const address = await tx.buyerAddress.create({
    data: {
      userId,
      label: input.label,
      line1: input.line1,
      line2: input.line2 || undefined,
      city: input.city,
      region: input.region || undefined,
      country: input.country,
      postalCode: input.postalCode || undefined,
      isDefault: input.isDefault ?? false,
    },
  });

  return address.id;
}

async function assertOwnAddress(tx: Prisma.TransactionClient, userId: string, addressId: string) {
  const address = await tx.buyerAddress.findFirst({
    where: { id: addressId, userId },
    select: { id: true },
  });
  if (!address) {
    throw new ApiError("forbidden", "You cannot use another buyer's address.", 403);
  }
  return address.id;
}

function scopeForUser(intent: BuyerIntentRecord, user: SafeUser): "admin" | "buyer" | "provider" | null {
  if (user.role === "main_admin") {
    return "admin";
  }
  if (user.role === "viewer" && intent.buyerId === user.id) {
    return "buyer";
  }
  if (user.providerId && intent.providerId === user.providerId) {
    return "provider";
  }
  return null;
}

function toBuyerIntentDto(intent: BuyerIntentRecord, scope: "admin" | "buyer" | "provider" | null) {
  const canSeeAddress = scope === "admin" || scope === "buyer";

  return {
    id: intent.id,
    buyerId: intent.buyerId,
    liveId: intent.liveId,
    liveTitle: intent.live?.title ?? null,
    providerId: intent.providerId,
    providerName: intent.provider?.displayName ?? null,
    productOrServiceName: intent.productOrServiceName,
    category: intent.category,
    intentType: intent.intentType,
    quantity: intent.quantity,
    budgetLabel: intent.budgetLabel,
    urgency: intent.urgency,
    status: intent.status,
    notes: intent.notes,
    createdAt: intent.createdAt.toISOString(),
    updatedAt: intent.updatedAt.toISOString(),
    address: canSeeAddress && intent.address ? toAddressDto(intent.address) : null,
    conciergeRequests: intent.conciergeRequests.map((request) => ({
      id: request.id,
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
    })),
    outcomes: intent.outcomes.map((outcome) => ({
      id: outcome.id,
      status: outcome.status,
      outcomeType: outcome.outcomeType,
      summary: outcome.summary,
      createdAt: outcome.createdAt.toISOString(),
      updatedAt: outcome.updatedAt.toISOString(),
    })),
  };
}

function toAddressDto(address: {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    region: address.region,
    country: address.country,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}
