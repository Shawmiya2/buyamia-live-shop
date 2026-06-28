import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { listCalendarEvents } from "@/lib/backend/procurement-service";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const type = params.get("type") ?? undefined;
    if (type !== "scheduled_live") {
      await requireRole("main_admin");
    }

    return jsonOk(
      await listCalendarEvents({
        category: params.get("category") ?? undefined,
        role: params.get("role") ?? undefined,
        status: params.get("status") ?? undefined,
        type,
        providerId: params.get("providerId") ?? undefined,
        from: params.get("from") ?? undefined,
        to: params.get("to") ?? undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
