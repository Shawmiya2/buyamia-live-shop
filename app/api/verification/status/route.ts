import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { updateVerificationStatus } from "@/lib/backend/verification-service";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (typeof body.userId !== "string" || !body.userId.trim()) {
      throw new Error("userId is required.");
    }

    return jsonOk(updateVerificationStatus(body.userId, body.status));
  } catch (error) {
    return jsonError(error);
  }
}
