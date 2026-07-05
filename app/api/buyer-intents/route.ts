import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { createBuyerIntent, listBuyerIntentsForUser } from "@/lib/backend/buyer-intent-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await listBuyerIntentsForUser(user));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await createBuyerIntent(user, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
