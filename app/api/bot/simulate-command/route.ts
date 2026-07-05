import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { runSimulatedBotCommand } from "@/lib/backend/bot-service";
import { readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await runSimulatedBotCommand(user, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}
