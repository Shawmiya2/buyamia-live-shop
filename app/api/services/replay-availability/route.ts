import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { listProviderReplays } from "@/lib/backend/live-service";

export async function GET(request: Request) {
  try {
    const user = await requireRole("service_provider");
    const providerId = await providerForCurrentUser(user);
    const params = new URL(request.url).searchParams;
    return jsonOk(await listProviderReplays(providerId, {
      replayStatus: params.get("replayStatus"),
      availability: params.get("availability"),
      createdAt: params.get("createdAt"),
      expiresAt: params.get("expiresAt"),
      category: params.get("category"),
      sort: params.get("sort"),
    }));
  } catch (error) {
    return jsonError(error);
  }
}
