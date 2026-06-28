import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createTasting, getRestaurantForTasting, listTastings } from "@/lib/backend/tasting-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireRole("main_admin", "restaurant");
    if (user.role === "main_admin") {
      return jsonOk({ restaurant: null, tastings: await listTastings() });
    }
    const providerId = await providerForCurrentUser(user);
    return jsonOk({
      restaurant: await getRestaurantForTasting(providerId),
      tastings: await listTastings(providerId),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("restaurant");
    const providerId = await providerForCurrentUser(user);
    return jsonOk(await createTasting(providerId, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
