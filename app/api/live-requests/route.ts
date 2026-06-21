import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createLiveRequest, listLiveRequests } from "@/lib/backend/live-request-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const providerId = user.role === "main_admin" ? undefined : await providerForCurrentUser(user);
    return jsonOk(await listLiveRequests({ providerId }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const providerId = await providerForCurrentUser(user);
    return jsonOk(await createLiveRequest(providerId, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
