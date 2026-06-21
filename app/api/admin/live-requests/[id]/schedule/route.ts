import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { scheduleApprovedLiveRequest } from "@/lib/backend/live-request-service";
import { readJson } from "@/lib/backend/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole("main_admin");
    const body = await readJson(request);
    return jsonOk(
      await scheduleApprovedLiveRequest({
        adminId: admin.id,
        requestId: (await params).id,
        scheduledAt: body.scheduledAt,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
