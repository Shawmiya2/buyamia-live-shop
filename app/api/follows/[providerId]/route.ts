import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { unfollowProvider } from "@/lib/backend/subscription-service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  try {
    const viewer = await requireRole("viewer");
    return jsonOk(await unfollowProvider({ viewerUserId: viewer.id, providerId: (await params).providerId }));
  } catch (error) {
    return jsonError(error);
  }
}
