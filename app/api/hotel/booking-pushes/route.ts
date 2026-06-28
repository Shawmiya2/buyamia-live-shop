import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createBookingPush, listBookingPushes } from "@/lib/backend/booking-push-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireRole("main_admin", "hotel");
    const providerId = user.role === "main_admin" ? undefined : await providerForCurrentUser(user);
    return jsonOk(await listBookingPushes(providerId));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("hotel");
    const providerId = await providerForCurrentUser(user);
    return jsonOk(await createBookingPush(providerId, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
