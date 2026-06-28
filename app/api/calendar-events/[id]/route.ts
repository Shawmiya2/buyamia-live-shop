import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { ApiError } from "@/lib/backend/errors";
import { getLiveDetailsById } from "@/lib/backend/live-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    if (decodedId.startsWith("live:")) {
      return jsonOk(await getLiveDetailsById(decodedId.slice("live:".length)));
    }

    await requireRole("main_admin");
    throw new ApiError("unsupported_calendar_event", "Only scheduled live calendar event details are available here.", 400);
  } catch (error) {
    return jsonError(error);
  }
}
