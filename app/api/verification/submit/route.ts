import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { submitVerificationMetadata } from "@/lib/backend/verification-service";
import { readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    return jsonOk(await submitVerificationMetadata(user.id, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
