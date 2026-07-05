import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { listBotCommands } from "@/lib/backend/bot-service";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await listBotCommands(user));
  } catch (error) {
    return jsonError(error);
  }
}
