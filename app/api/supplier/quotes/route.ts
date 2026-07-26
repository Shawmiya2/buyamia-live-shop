import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { createSupplierQuote, listSupplierQuoteRfqs } from "@/lib/backend/procurement-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    await requireRole("supplier");
    return jsonOk(await listSupplierQuoteRfqs());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("supplier");
    if (!user.providerId) throw new Error("A supplier profile is required.");
    return jsonOk(await createSupplierQuote(user.id, user.providerId, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
