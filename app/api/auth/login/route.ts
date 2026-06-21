import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { createSession, loginUser, sessionCookieName, toAccountResponse } from "@/lib/backend/auth-service";
import { loginSchema, readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await readJson(request));
    const user = await loginUser(body.email, body.password);
    const session = await createSession(user.id);

    (await cookies()).set(sessionCookieName, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expiresAt,
      path: "/",
    });

    return jsonOk(toAccountResponse(user));
  } catch (error) {
    return jsonError(error);
  }
}
