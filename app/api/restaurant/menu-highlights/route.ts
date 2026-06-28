import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createMenuHighlight, listMenuHighlights } from "@/lib/backend/menu-highlight-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(request: Request) {
  try {
    const user = await requireRole("main_admin", "restaurant");
    const providerId = user.role === "main_admin" ? undefined : await providerForCurrentUser(user);
    const searchParams = new URL(request.url).searchParams;
    return jsonOk(await listMenuHighlights(providerId, {
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      availabilityStatus: searchParams.get("availabilityStatus") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      featured: searchParams.get("featured") ?? undefined,
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
    return jsonOk(await createMenuHighlight(providerId, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
