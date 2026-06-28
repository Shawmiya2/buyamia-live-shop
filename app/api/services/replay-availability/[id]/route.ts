import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { updateProviderReplayAvailability } from "@/lib/backend/live-service";
import { readJson } from "@/lib/backend/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("service_provider");
    const providerId = await providerForCurrentUser(user);
    const { id } = await params;
    return jsonOk(await updateProviderReplayAvailability(providerId, id, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}
