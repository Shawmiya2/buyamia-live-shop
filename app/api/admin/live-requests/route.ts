import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { listLiveRequests } from "@/lib/backend/live-request-service";

export async function GET() {
  try {
    await requireRole("main_admin");
    return jsonOk(await listLiveRequests());
  } catch (error) {
    return jsonError(error);
  }
}
