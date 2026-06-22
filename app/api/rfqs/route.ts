import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { createRfq, listRfqs } from "@/lib/backend/procurement-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    await requireRole("main_admin");
    return jsonOk(await listRfqs());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("main_admin");
    return jsonOk(await createRfq(user.id, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
