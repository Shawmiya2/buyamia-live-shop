import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser, requireRole } from "@/lib/backend/auth-context";
import { ApiError } from "@/lib/backend/errors";
import { getVerificationStatus, reviewVerification } from "@/lib/backend/verification-service";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const user = await requireAuthenticatedUser();
    if (user.role !== "main_admin" && user.id !== userId) {
      throw new ApiError("forbidden", "You cannot view another user's verification.", 403);
    }
    return jsonOk(await getVerificationStatus(userId));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireRole("main_admin");
    const body = await request.json();
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
