import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { createSession, sessionCookieName, signupUser, toAccountResponse } from "@/lib/backend/auth-service";
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
    const user = await signupUser(accountInput);
    const session = await createSession(user.id);

    (await cookies()).set(sessionCookieName, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expiresAt,
      path: "/",
    });

    return jsonOk(toAccountResponse(user), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
