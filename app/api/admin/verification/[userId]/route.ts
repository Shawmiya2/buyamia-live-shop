import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { reviewVerification } from "@/lib/backend/verification-service";
import { readJson } from "@/lib/backend/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireRole("main_admin");
    const body = await readJson(request);
    return jsonOk(
      await reviewVerification({
        adminId: admin.id,
        userId: (await params).userId,
        status: body.status,
        reviewNote: body.reviewNote,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
