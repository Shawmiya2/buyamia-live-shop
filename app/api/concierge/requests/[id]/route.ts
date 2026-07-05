import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { getConciergeRequestForUser, updateConciergeRequest } from "@/lib/backend/concierge-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await getConciergeRequestForUser((await params).id, user));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await updateConciergeRequest((await params).id, user, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}
