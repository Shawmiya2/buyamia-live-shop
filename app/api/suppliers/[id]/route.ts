import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { getSupplierDetail } from "@/lib/backend/procurement-service";

export async function GET(_request: Request, context: RouteContext<"/api/suppliers/[id]">) {
  try {
    await requireRole("main_admin");
    const { id } = await context.params;
    return jsonOk(await getSupplierDetail(id));
  } catch (error) {
    return jsonError(error);
  }
}
