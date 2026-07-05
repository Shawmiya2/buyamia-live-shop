import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { createReferral } from "@/lib/backend/ambassador-service";
import { readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const viewer = await requireRole("viewer");
    const body = await readJson(request);
    return jsonOk(
      await createReferral({
        user: viewer,
        referredEmail: body.referredEmail,
        referredUserId: body.referredUserId,
        source: body.source,
      }),
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
