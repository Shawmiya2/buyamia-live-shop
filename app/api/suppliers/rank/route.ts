import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { rankSuppliers } from "@/lib/backend/procurement-service";

export async function GET(request: Request) {
  try {
    await requireRole("main_admin");
    const params = new URL(request.url).searchParams;
    return jsonOk(
      await rankSuppliers({
        search: params.get("search") ?? undefined,
        category: params.get("category") ?? undefined,
        verification: params.get("verification") ?? undefined,
        location: params.get("location") ?? undefined,
        sort: params.get("sort") ?? undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
