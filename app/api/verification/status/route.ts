import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser, requireRole } from "@/lib/backend/auth-context";
import { getVerificationStatus, reviewVerification } from "@/lib/backend/verification-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await getVerificationStatus(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireRole("main_admin");
    const body = await readJson(request);
    return jsonOk(
      await reviewVerification({
        adminId: admin.id,
        userId: body.userId,
        status: body.status,
        reviewNote: body.reviewNote,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
