import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { getBuyerIntentForUser } from "@/lib/backend/buyer-intent-service";
import { createConciergeRequestForIntent, listConciergeRequestsForUser } from "@/lib/backend/concierge-service";
import { readJson } from "@/lib/backend/validation";
import { ValidationApiError } from "@/lib/backend/errors";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await listConciergeRequestsForUser(user));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await readJson(request);
    const buyerIntentId = body && typeof body === "object" && "buyerIntentId" in body
      ? String(body.buyerIntentId)
      : "";
    if (!buyerIntentId) {
      throw new ValidationApiError({ buyerIntentId: "Buyer intent is required." });
    }
    await getBuyerIntentForUser(buyerIntentId, user);
    return jsonOk(await createConciergeRequestForIntent(buyerIntentId), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
