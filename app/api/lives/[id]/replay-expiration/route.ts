import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { extendReplayAvailability } from "@/lib/backend/live-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    return jsonOk(
      extendReplayAvailability({
        liveId: id,
        extensionDays: body.extensionDays,
        planLabel: body.planLabel,
        priceLabel: body.priceLabel,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
