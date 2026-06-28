import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { updateSellerApplicationStatus } from "@/lib/backend/seller-application-service";
import { readJson } from "@/lib/backend/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("main_admin");
    const { id } = await params;

    return jsonOk(await updateSellerApplicationStatus(id, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}
