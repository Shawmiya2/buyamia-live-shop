import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { reviewLiveRequest } from "@/lib/backend/live-request-service";
import { readJson } from "@/lib/backend/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole("main_admin");
    const body = await readJson(request);
    return jsonOk(
      await reviewLiveRequest({
        adminId: admin.id,
        requestId: (await params).id,
        status: body.status,
        adminNote: body.adminNote,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
