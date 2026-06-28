import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import {
  createPinnedPlacementRequest,
  getPinnedPlacementOptions,
  listPinnedPlacementRequests,
} from "@/lib/backend/pinned-placement-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireRole("service_provider");
    const providerId = await providerForCurrentUser(user);
    return jsonOk({
      options: await getPinnedPlacementOptions(providerId),
      requests: await listPinnedPlacementRequests(providerId),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("service_provider");
    const providerId = await providerForCurrentUser(user);
    return jsonOk(await createPinnedPlacementRequest(providerId, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
