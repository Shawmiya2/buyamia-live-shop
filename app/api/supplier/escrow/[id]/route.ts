import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { updateProviderNegotiation } from "@/lib/backend/procurement-service";
import { readJson } from "@/lib/backend/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("supplier");
    if (!user.providerId) {
      throw new Error("A supplier profile is required.");
    }
    const { id } = await context.params;
    return jsonOk(
      await updateProviderNegotiation(user.id, user.providerId, id, await readJson(request)),
    );
  } catch (error) {
    return jsonError(error);
  }
}
