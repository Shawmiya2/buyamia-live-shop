import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { joinAmbassadorProgram } from "@/lib/backend/ambassador-service";

export async function POST() {
  try {
    const viewer = await requireRole("viewer");
    return jsonOk(await joinAmbassadorProgram(viewer), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
