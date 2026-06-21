import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { createSession, sessionCookieName, signupUser, toAccountResponse } from "@/lib/backend/auth-service";
import { readJson, signupSchema } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await readJson(request));
    const user = await signupUser(body);
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
