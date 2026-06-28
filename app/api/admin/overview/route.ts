import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { getDashboardData } from "@/lib/backend/dashboard-service";

export async function GET() {
  try {
    const admin = await requireRole("main_admin");
    return jsonOk(await getDashboardData("main", admin));
  } catch (error) {
    return jsonError(error);
  }
}
