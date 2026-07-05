import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { getAdminAmbassadorOverview } from "@/lib/backend/ambassador-service";

export async function GET(request: Request) {
  try {
    await requireRole("main_admin");
    const url = new URL(request.url);
    return jsonOk(await getAdminAmbassadorOverview({ search: url.searchParams.get("search") ?? undefined }));
  } catch (error) {
    return jsonError(error);
  }
}
