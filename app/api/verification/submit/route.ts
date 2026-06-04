import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { submitVerificationMetadata } from "@/lib/backend/verification-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return jsonOk(submitVerificationMetadata(body), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
