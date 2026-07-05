import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { getAmbassadorForUser } from "@/lib/backend/ambassador-service";

export async function GET() {
  try {
    const viewer = await requireRole("viewer");
    return jsonOk(await getAmbassadorForUser(viewer.id));
  } catch (error) {
    return jsonError(error);
  }
}
