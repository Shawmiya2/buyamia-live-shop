import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { listHotelsForComparison } from "@/lib/backend/hotel-comparison-service";

export async function GET(request: Request) {
  try {
    const user = await requireRole("viewer");
    const searchParams = new URL(request.url).searchParams;
    const ids = searchParams.getAll("id");
    return jsonOk(await listHotelsForComparison(user, { ids }));
  } catch (error) {
    return jsonError(error);
  }
}
