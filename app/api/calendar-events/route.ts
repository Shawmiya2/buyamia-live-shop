import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { listCalendarEvents } from "@/lib/backend/procurement-service";

export async function GET(request: Request) {
  try {
    await requireRole("main_admin");
    const params = new URL(request.url).searchParams;
    return jsonOk(
      await listCalendarEvents({
        category: params.get("category") ?? undefined,
        role: params.get("role") ?? undefined,
        status: params.get("status") ?? undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
