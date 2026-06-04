import { jsonError, jsonOk } from "@/lib/backend/api-response";
import {
  getVerificationStatus,
  updateVerificationStatus,
} from "@/lib/backend/verification-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    return jsonOk(getVerificationStatus(userId));
  } catch (error) {
    return jsonError(error, 404);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    return jsonOk(updateVerificationStatus(userId, body.status));
  } catch (error) {
    return jsonError(error);
  }
}
