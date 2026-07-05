import type { BotActionType, BotChannel, BotCommandStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { createLiveRequest, listLiveRequests } from "./live-request-service";
import { providerForCurrentUser } from "./dashboard-service";
import { getDashboardForRole, isProviderRole } from "./role-guard";
import { datePlusDays } from "./replay-policy";
import type { SafeUser } from "./types";
import { detectBotIntent, getSuggestedBotCommands } from "./bot-intent-service";

const channelSchema = z.enum(["whatsapp", "telegram"]).default("whatsapp");
const connectionSchema = z.object({
  channel: channelSchema,
  handle: z.string().trim().min(1, "Please enter a WhatsApp or Telegram handle."),
  phoneNumber: z.string().trim().optional(),
});
const simulateSchema = z.object({
  channel: channelSchema,
  message: z.string().trim().min(1, "Please enter a command."),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type BotCommandResult = {
  intent: BotActionType;
  status: BotCommandStatus;
  responseText: string;
  actionRequestId?: string;
  createdLiveRequestId?: string;
  suggestedCommands: string[];
};

export function parseBotChannel(value: unknown): BotChannel {
  return channelSchema.parse(value);
}

export async function listBotConnections(userId: string) {
  return prisma.botChannelConnection.findMany({
    where: { userId },
    orderBy: { channel: "asc" },
  });
}

export async function upsertBotConnection(user: SafeUser, input: unknown) {
  const parsed = connectionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError({
      handle: parsed.error.issues[0]?.message ?? "Please enter a valid handle.",
    });
  }

  return prisma.botChannelConnection.upsert({
    where: { userId_channel: { userId: user.id, channel: parsed.data.channel } },
    update: {
      handle: parsed.data.handle,
      phoneNumber: parsed.data.phoneNumber || null,
      status: "pending_verification",
      providerMetadata: {
        mode: "demo",
        note: "Provider credentials are not configured in local demo mode.",
      },
    },
    create: {
      userId: user.id,
      channel: parsed.data.channel,
      handle: parsed.data.handle,
      phoneNumber: parsed.data.phoneNumber || null,
      status: "pending_verification",
      providerMetadata: {
        mode: "demo",
        note: "Provider credentials are not configured in local demo mode.",
      },
    },
  });
}

export async function listBotLogs(userId: string, limit = 20) {
  return prisma.botCommandLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listBotCommands(user: SafeUser) {
  return {
    providerConfigured: false,
    demoMode: true,
    commands: getSuggestedBotCommands(user.role),
  };
}

export async function runSimulatedBotCommand(user: SafeUser, input: unknown): Promise<BotCommandResult> {
  const parsed = simulateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError({
      message: parsed.error.issues[0]?.message ?? "Please enter a command.",
    });
  }

  const result = await executeBotCommand({
    user,
    channel: parsed.data.channel,
    message: parsed.data.message,
    payload: parsed.data.payload,
  });

  await prisma.botCommandLog.create({
    data: {
      userId: user.id,
      channel: parsed.data.channel,
      rawMessage: parsed.data.message,
      detectedIntent: result.intent,
      status: result.status,
      responseText: result.responseText,
    },
  });

  return result;
}

async function executeBotCommand(input: {
  user: SafeUser;
  channel: BotChannel;
  message: string;
  payload?: Record<string, unknown>;
}): Promise<BotCommandResult> {
  const intent = detectBotIntent(input.message);
  let status: BotCommandStatus = "success";
  let actionRequestId: string | undefined;
  let createdLiveRequestId: string | undefined;

  try {
    const responseText = await buildBotResponse(input.user, intent.actionType, input.payload);
    const action = await maybeCreateActionRequest(input.user.id, intent.actionType, input.payload, "completed");
    actionRequestId = action?.id;
    if (action?.payload && typeof action.payload === "object" && "createdLiveRequestId" in action.payload) {
      createdLiveRequestId = String(action.payload.createdLiveRequestId);
    }

    return {
      intent: intent.actionType,
      status,
      responseText,
      actionRequestId,
      createdLiveRequestId,
      suggestedCommands: getSuggestedBotCommands(input.user.role),
    };
  } catch (error) {
    status = error instanceof ApiError && error.status === 403 ? "failed" : "failed";
    const responseText = error instanceof Error ? error.message : "The bot could not complete that command.";
    await maybeCreateActionRequest(input.user.id, intent.actionType, input.payload, "failed");
    return {
      intent: intent.actionType,
      status,
      responseText,
      suggestedCommands: getSuggestedBotCommands(input.user.role),
    };
  }
}

async function buildBotResponse(user: SafeUser, actionType: BotActionType, payload?: Record<string, unknown>) {
  if (actionType === "account_summary") {
    return accountSummary(user);
  }
  if (actionType === "schedule_live") {
    return scheduleLive(user);
  }
  if (actionType === "check_live_availability") {
    return availableSlots(user);
  }
  if (actionType === "create_live_request") {
    return createLiveRequestFromBot(user, payload);
  }
  if (actionType === "live_status") {
    return liveStatus(user);
  }
  if (actionType === "rfq_summary") {
    return rfqSummary(user);
  }
  if (actionType === "create_account") {
    return accountSetupFlow(payload);
  }
  return helpText(user);
}

async function accountSummary(user: SafeUser) {
  const providerId = isProviderRole(user.role) ? user.providerId : undefined;
  const pendingLiveRequests = providerId
    ? await prisma.liveRequest.count({ where: { providerId, status: "pending_review" } })
    : user.role === "main_admin"
      ? await prisma.liveRequest.count({ where: { status: "pending_review" } })
      : 0;
  const upcomingLives = providerId
    ? await prisma.live.count({ where: { providerId, status: "scheduled", scheduledAt: { gte: new Date() } } })
    : user.role === "main_admin"
      ? await prisma.live.count({ where: { status: "scheduled", scheduledAt: { gte: new Date() } } })
      : 0;

  return [
    `Account summary for ${user.name}`,
    `Role: ${user.role.replace(/_/g, " ")}`,
    `Dashboard: ${getDashboardForRole(user.role)}`,
    `Verification: ${user.verificationStatus.replace(/_/g, " ")}`,
    `Pending live requests: ${pendingLiveRequests}`,
    `Upcoming lives: ${upcomingLives}`,
  ].join("\n");
}

async function scheduleLive(user: SafeUser) {
  if (!isProviderRole(user.role)) {
    throw new ApiError("forbidden", "Only provider accounts can schedule or request lives through the bot.", 403);
  }

  const slots = await getAvailableLiveSlots(user);
  const action = await prisma.botActionRequest.create({
    data: {
      userId: user.id,
      actionType: "schedule_live",
      status: "pending_confirmation",
      payload: { suggestedSlots: slots } as Prisma.InputJsonValue,
    },
  });

  return [
    "Live scheduling flow started in demo mode.",
    "Choose one suggested slot on this page, then run Create live request.",
    `Draft action: ${action.id}`,
    ...slots.map((slot, index) => `${index + 1}. ${slot.label}`),
  ].join("\n");
}

async function availableSlots(user: SafeUser) {
  const slots = await getAvailableLiveSlots(user);
  return ["Available demo live setup slots:", ...slots.map((slot, index) => `${index + 1}. ${slot.label}`)].join("\n");
}

async function createLiveRequestFromBot(user: SafeUser, payload?: Record<string, unknown>) {
  const providerId = await providerForCurrentUser(user);
  const slots = await getAvailableLiveSlots(user);
  const slotIndex = Number(payload?.slotIndex ?? 0);
  const selectedSlot = slots[Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < slots.length ? slotIndex : 0];
  const request = await createLiveRequest(providerId, {
    title: typeof payload?.title === "string" && payload.title.trim() ? payload.title : `${user.name} bot live request`,
    category: user.role,
    description:
      typeof payload?.description === "string" && payload.description.trim()
        ? payload.description
        : "Demo live request created from the Remote Account Bot simulator.",
    preferredDate: selectedSlot.startsAt,
    status: "draft",
  });

  await prisma.botActionRequest.create({
    data: {
      userId: user.id,
      actionType: "create_live_request",
      status: "completed",
      payload: {
        selectedSlot,
        createdLiveRequestId: request.id,
      } as Prisma.InputJsonValue,
    },
  });

  return [
    "Created a draft live request from the bot demo.",
    `Request: ${request.title}`,
    `Status: ${request.status}`,
    `Preferred slot: ${selectedSlot.label}`,
    "This did not contact WhatsApp or Telegram.",
  ].join("\n");
}

async function liveStatus(user: SafeUser) {
  const providerId = user.role === "main_admin" ? undefined : await providerForCurrentUser(user);
  const requests = await listLiveRequests({ providerId });
  if (requests.length === 0) {
    return "No live requests found for this account.";
  }

  return [
    "Live request status:",
    ...requests.slice(0, 6).map((request) => `${request.title}: ${request.status.replace(/_/g, " ")}`),
  ].join("\n");
}

async function rfqSummary(user: SafeUser) {
  if (user.role !== "main_admin") {
    throw new ApiError("forbidden", "RFQ summary is only available to main admin accounts.", 403);
  }

  const [open, inReview, awarded, closed] = await Promise.all([
    prisma.rfq.count({ where: { status: "open" } }),
    prisma.rfq.count({ where: { status: "in_review" } }),
    prisma.rfq.count({ where: { status: "awarded" } }),
    prisma.rfq.count({ where: { status: "closed" } }),
  ]);

  return [
    "RFQ summary:",
    `Open: ${open}`,
    `In review: ${inReview}`,
    `Awarded: ${awarded}`,
    `Closed: ${closed}`,
    "Open procurement dashboard: /dashboard/main/rfqs",
  ].join("\n");
}

function accountSetupFlow(payload?: Record<string, unknown>) {
  const profileType = typeof payload?.profileType === "string" ? payload.profileType : "not selected";
  const name = typeof payload?.name === "string" ? payload.name : "not collected";
  const email = typeof payload?.email === "string" ? payload.email : "not collected";

  return [
    "Demo account setup flow:",
    `Profile type: ${profileType}`,
    `Name: ${name}`,
    `Email: ${email}`,
    "Real WhatsApp or Telegram onboarding requires provider integration and cannot bypass normal signup authentication.",
    "Continue at /signup",
  ].join("\n");
}

function helpText(user: SafeUser) {
  return [
    "Supported Remote Account Bot commands:",
    ...getSuggestedBotCommands(user.role).map((command) => `- ${command}`),
    "Demo mode validates and logs commands locally. No external WhatsApp or Telegram message is sent.",
  ].join("\n");
}

async function maybeCreateActionRequest(
  userId: string,
  actionType: BotActionType,
  payload: Record<string, unknown> | undefined,
  status: "completed" | "failed",
) {
  if (actionType === "create_live_request" || actionType === "schedule_live") {
    return null;
  }

  return prisma.botActionRequest.create({
    data: {
      userId,
      actionType,
      status,
      payload: (payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getAvailableLiveSlots(user: SafeUser) {
  const providerId = isProviderRole(user.role) ? user.providerId : undefined;
  const scheduled = await prisma.live.findMany({
    where: {
      providerId,
      status: "scheduled",
      scheduledAt: { gte: new Date() },
    },
    select: { scheduledAt: true },
  });
  const busyDays = new Set(
    scheduled
      .map((live) => live.scheduledAt?.toISOString().slice(0, 10))
      .filter(Boolean),
  );
  const hours = [9, 13, 16, 19];
  const slots: Array<{ startsAt: string; label: string }> = [];

  for (let day = 1; day <= 10 && slots.length < 4; day += 1) {
    const date = datePlusDays(new Date(), day);
    const dayKey = date.toISOString().slice(0, 10);
    for (const hour of hours) {
      if (slots.length >= 4) {
        break;
      }
      const candidate = new Date(date);
      candidate.setHours(hour, 0, 0, 0);
      if (!busyDays.has(dayKey) || hour !== 13) {
        slots.push({
          startsAt: candidate.toISOString(),
          label: new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(candidate),
        });
      }
    }
  }

  return slots;
}
