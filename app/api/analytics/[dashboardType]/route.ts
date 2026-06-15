import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getAnalyticsSummary } from "@/lib/backend/analytics-service";
import { getDemoAccessContext } from "@/lib/backend/demo-request";
import { isDashboardType } from "@/lib/backend/dashboard-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dashboardType: string }> },
) {
  try {
    const { dashboardType } = await params;

    if (!isDashboardType(dashboardType)) {
      return jsonError(new Error("Invalid dashboard type."), 404);
    }

    const accessContext = getDemoAccessContext(request, dashboardType);

    if (!accessContext.accessGranted) {
      return jsonOk(
        {
          error: "Demo role cannot access this dashboard analytics.",
          dashboardType,
          auth: accessContext,
        },
        { status: 403 },
      );
    }

    return jsonOk({
      dashboardType,
      auth: accessContext,
      analyticsSummary: getAnalyticsSummary(
        dashboardType,
        accessContext.currentUserId,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
