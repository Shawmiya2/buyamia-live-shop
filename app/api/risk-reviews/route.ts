import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { listRiskItems, recordRiskDecision } from "@/lib/backend/procurement-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(request: Request) {
  try {
    await requireRole("main_admin");
    const params = new URL(request.url).searchParams;
    return jsonOk(
      await listRiskItems({
        role: params.get("role") ?? undefined,
        verification: params.get("verification") ?? undefined,
        riskLevel: params.get("riskLevel") ?? undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole("main_admin");
    return jsonOk(await recordRiskDecision(user.id, await readJson(request)));
  } catch (error) {
    return jsonError(error);
  }
}
