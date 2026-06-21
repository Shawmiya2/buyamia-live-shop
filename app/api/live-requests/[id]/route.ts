import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { ApiError } from "@/lib/backend/errors";
import { cancelLiveRequest, getLiveRequest, updateLiveRequest } from "@/lib/backend/live-request-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const liveRequest = await getLiveRequest((await params).id);
    if (user.role !== "main_admin" && liveRequest.providerId !== user.providerId) {
      throw new ApiError("forbidden", "You cannot view another provider's request.", 403);
    }
    return jsonOk(liveRequest);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const providerId = await providerForCurrentUser(user);
    return jsonOk(await updateLiveRequest(providerId, (await params).id, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const providerId = await providerForCurrentUser(user);
    return jsonOk(await cancelLiveRequest(providerId, (await params).id));
  } catch (error) {
    return jsonError(error);
  }
}
