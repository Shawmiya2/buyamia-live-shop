import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getAnalyticsSummary } from "@/lib/backend/analytics-service";
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

    return jsonOk({
      dashboardType,
      analyticsSummary: getAnalyticsSummary(dashboardType),
    });
  } catch (error) {
    return jsonError(error);
  }
}
