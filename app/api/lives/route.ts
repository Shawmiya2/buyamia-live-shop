import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { listLives } from "@/lib/backend/live-service";

export async function GET(request: Request) {
  try {
    await requireRole("main_admin");
    const params = new URL(request.url).searchParams;

    return jsonOk(
      await listLives({
        page: params.get("page"),
        pageSize: params.get("pageSize"),
        search: params.get("search"),
        status: params.get("status"),
        category: params.get("category"),
        providerRole: params.get("providerRole"),
        providerId: params.get("providerId"),
        pinned: params.get("pinned"),
        pinReason: params.get("pinReason"),
        replayStatus: params.get("replayStatus"),
        dateFrom: params.get("dateFrom"),
        dateTo: params.get("dateTo"),
        sort: params.get("sort"),
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
