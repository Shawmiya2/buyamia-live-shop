import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { runAssistantQuery } from "@/lib/backend/assistant-service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    return jsonOk(await runAssistantQuery(body, user));
  } catch (error) {
    return jsonError(error);
  }
}
