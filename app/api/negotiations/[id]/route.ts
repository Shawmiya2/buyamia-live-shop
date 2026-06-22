import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { getNegotiation, updateNegotiation } from "@/lib/backend/procurement-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(_request: Request, context: RouteContext<"/api/negotiations/[id]">) {
  try {
    await requireRole("main_admin");
    const { id } = await context.params;
    return jsonOk(await getNegotiation(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext<"/api/negotiations/[id]">) {
  try {
    const user = await requireRole("main_admin");
    const { id } = await context.params;
    return jsonOk(await updateNegotiation(user.id, id, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}
