import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { deleteMenuHighlight, getMenuHighlight, updateMenuHighlight } from "@/lib/backend/menu-highlight-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("restaurant");
    const providerId = await providerForCurrentUser(user);
    const { id } = await params;
    return jsonOk(await getMenuHighlight(providerId, id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("restaurant");
    const providerId = await providerForCurrentUser(user);
    const { id } = await params;
    return jsonOk(await updateMenuHighlight(providerId, id, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("restaurant");
    const providerId = await providerForCurrentUser(user);
    const { id } = await params;
    return jsonOk(await deleteMenuHighlight(providerId, id));
  } catch (error) {
    return jsonError(error);
  }
}
