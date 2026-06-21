import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { updateLivePin } from "@/lib/backend/live-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const admin = await requireRole("main_admin");

    return jsonOk(
      updateLivePin({
        liveId: id,
        isPinned: body.isPinned,
        pinReason: body.pinReason,
        pinExpiresAt: body.pinExpiresAt,
        priorityScore: body.priorityScore,
        adminId: admin.id,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
