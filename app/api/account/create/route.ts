import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { signupUser, toAccountResponse } from "@/lib/backend/auth-service";
import { readJson, signupSchema } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await readJson(request));

    return jsonOk(toAccountResponse(await signupUser(body)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
