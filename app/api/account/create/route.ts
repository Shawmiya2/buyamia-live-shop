import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { signupUser, toAccountResponse } from "@/lib/backend/auth-service";
import { readJson, parseSignupInput } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const body = parseSignupInput(await readJson(request));
    const accountInput = {
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
    };

    return jsonOk(toAccountResponse(await signupUser(accountInput)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
