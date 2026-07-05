import { z } from "zod";
import type { BotChannel } from "@prisma/client";
import { ValidationApiError } from "./errors";

export type BotProviderMessage = {
  channel: BotChannel;
  externalMessageId?: string;
  from: string;
  text: string;
};

export type BotProviderResult = {
  configured: boolean;
  accepted: boolean;
  message: string;
};

const webhookSchema = z.object({
  from: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1).optional(),
  text: z.string().trim().min(1).optional(),
  messageId: z.string().trim().optional(),
});

export function parseDemoWebhookPayload(channel: BotChannel, input: unknown): BotProviderMessage {
  const result = webhookSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationApiError({
      payload: "Webhook payload must include a sender and message text.",
    });
  }

  const text = result.data.message ?? result.data.text;
  if (!result.data.from || !text) {
    throw new ValidationApiError({
      payload: "Webhook payload must include from and message or text.",
    });
  }

  return {
    channel,
    externalMessageId: result.data.messageId,
    from: result.data.from,
    text,
  };
}

export function getBotProviderStatus(channel: BotChannel): BotProviderResult {
  return {
    configured: false,
    accepted: true,
    message: `${formatChannel(channel)} provider is not configured. Demo payload was validated locally; no external message was sent.`,
  };
}

function formatChannel(channel: BotChannel) {
  return channel === "whatsapp" ? "WhatsApp" : "Telegram";
}
