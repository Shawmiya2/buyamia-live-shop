import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";

export async function GET() {
  try {
    return jsonOk({ user: await requireAuthenticatedUser() });
  } catch (error) {
    return jsonError(error);
  }
}
