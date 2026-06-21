import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getAnalyticsSummary } from "@/lib/backend/analytics-service";
import { requireDashboardAccess } from "@/lib/backend/auth-context";
import { isDashboardType } from "@/lib/backend/dashboard-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dashboardType: string }> },
) {
  try {
    const { dashboardType } = await params;

    if (!isDashboardType(dashboardType)) {
      return jsonError(new Error("Invalid dashboard type."), 404);
    }

    const user = await requireDashboardAccess(dashboardType);

    return jsonOk({
      dashboardType,
      analyticsSummary: await getAnalyticsSummary(
        dashboardType,
        user.id,
        user.providerId,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
