import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { getRecentAdminActivity } from "@/lib/backend/admin-activity-service";

export async function GET() {
  try {
    await requireRole("main_admin");
    return jsonOk(await getRecentAdminActivity());
  } catch (error) {
    return jsonError(error);
  }
}
