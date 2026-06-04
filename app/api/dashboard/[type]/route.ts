import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getDemoAccessContext } from "@/lib/backend/demo-request";
import {
  getDashboardData,
  isDashboardType,
} from "@/lib/backend/dashboard-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;

    if (!isDashboardType(type)) {
      return jsonError(new Error("Invalid dashboard type."), 404);
    }

    const accessContext = getDemoAccessContext(request, type);

    if (!accessContext.accessGranted) {
      return jsonOk(
        {
          error: "Demo role cannot access this dashboard.",
          dashboardType: type,
          auth: accessContext,
        },
        { status: 403 },
      );
    }

    return jsonOk(getDashboardData(type, accessContext));
  } catch (error) {
    return jsonError(error);
  }
}
