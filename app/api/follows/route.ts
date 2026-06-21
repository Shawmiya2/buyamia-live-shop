import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { followProvider, getFollowedProviders } from "@/lib/backend/subscription-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const viewer = await requireRole("viewer");
    return jsonOk(await getFollowedProviders(viewer.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireRole("viewer");
    const body = await readJson(request);
    return jsonOk(await followProvider({ viewerUserId: viewer.id, providerId: body.providerId }), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
