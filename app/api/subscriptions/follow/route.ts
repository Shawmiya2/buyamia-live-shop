import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { followProvider, unfollowProvider } from "@/lib/backend/subscription-service";

export async function POST(request: Request) {
  try {
    const viewer = await requireRole("viewer");
    const body = await request.json();
    return jsonOk(await followProvider({ viewerUserId: viewer.id, providerId: body.providerId }), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const viewer = await requireRole("viewer");
    const body = await request.json();
    return jsonOk(await unfollowProvider({ viewerUserId: viewer.id, providerId: body.providerId }));
  } catch (error) {
    return jsonError(error);
  }
}
