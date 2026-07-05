import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getBotProviderStatus, parseDemoWebhookPayload } from "@/lib/backend/bot-provider-adapter";
import { readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const message = parseDemoWebhookPayload("telegram", await readJson(request));
    return jsonOk({
      channel: message.channel,
      from: message.from,
      provider: getBotProviderStatus("telegram"),
    });
  } catch (error) {
    return jsonError(error);
  }
}
