import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { listBotConnections, upsertBotConnection } from "@/lib/backend/bot-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await listBotConnections(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await upsertBotConnection(user, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
