import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { logoutSession, sessionCookieName } from "@/lib/backend/auth-service";

export async function POST() {
  try {
    const cookieStore = await cookies();
    await logoutSession(cookieStore.get(sessionCookieName)?.value);
    cookieStore.set(sessionCookieName, "", { httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
    return jsonOk({ loggedOut: true });
  } catch (error) {
    return jsonError(error);
  }
}
