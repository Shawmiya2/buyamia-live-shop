import { jsonError, jsonOk } from "@/lib/backend/api-response";
import {
  getDashboardData,
  isDashboardType,
} from "@/lib/backend/dashboard-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;

    if (!isDashboardType(type)) {
      return jsonError(new Error("Invalid dashboard type."), 404);
    }

    return jsonOk(getDashboardData(type));
  } catch (error) {
    return jsonError(error);
  }
}
