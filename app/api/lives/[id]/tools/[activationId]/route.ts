import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { updateToolActivation } from "@/lib/backend/presenter-tool-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; activationId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { id, activationId } = await params;
    const activation = await updateToolActivation({
      liveId: id,
      activationId,
      user,
      data: await request.json(),
    });

    return jsonOk(activation);
  } catch (error) {
    return jsonError(error);
  }
}
