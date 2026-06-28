import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createScheduledStream } from "@/lib/backend/live-service";
import { readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const providerId = await providerForCurrentUser(user);

    return jsonOk(
      await createScheduledStream(providerId, await readJson(request)),
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
