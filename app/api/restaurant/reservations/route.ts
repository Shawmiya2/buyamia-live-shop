import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createReservation, listReservations } from "@/lib/backend/reservation-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(request: Request) {
  try {
    const user = await requireRole("main_admin", "restaurant");
    const providerId = user.role === "main_admin" ? undefined : await providerForCurrentUser(user);
    const searchParams = new URL(request.url).searchParams;
    return jsonOk(await listReservations(providerId, {
      date: searchParams.get("date") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      partySize: searchParams.get("partySize") ?? undefined,
      customerName: searchParams.get("customerName") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("restaurant");
    const providerId = await providerForCurrentUser(user);
    return jsonOk(await createReservation(providerId, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
