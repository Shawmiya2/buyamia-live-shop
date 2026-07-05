import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { createCommunityShare } from "@/lib/backend/ambassador-service";
import { readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const viewer = await requireRole("viewer");
    const body = await readJson(request);
    return jsonOk(
      await createCommunityShare({
        user: viewer,
        channel: body.channel,
        liveId: body.liveId,
        providerId: body.providerId,
        replay: Boolean(body.replay),
      }),
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
