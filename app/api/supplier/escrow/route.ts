import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { listProviderNegotiations } from "@/lib/backend/procurement-service";

export async function GET() {
  try {
    const user = await requireRole("supplier");
    if (!user.providerId) {
      throw new Error("A supplier profile is required.");
    }
    return jsonOk(await listProviderNegotiations(user.providerId));
  } catch (error) {
    return jsonError(error);
  }
}
