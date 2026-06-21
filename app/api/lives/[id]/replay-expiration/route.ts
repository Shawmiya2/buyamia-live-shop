import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { extendReplayAvailability } from "@/lib/backend/live-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const admin = await requireRole("main_admin");

    return jsonOk(
      extendReplayAvailability({
        liveId: id,
        extensionDays: body.extensionDays,
        adminId: admin.id,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
