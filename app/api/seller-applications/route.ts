import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { createSellerApplication, listSellerApplications } from "@/lib/backend/seller-application-service";
import { readJson } from "@/lib/backend/validation";

export async function GET(request: Request) {
  try {
    await requireRole("main_admin");
    const params = new URL(request.url).searchParams;

    return jsonOk(
      await listSellerApplications({
        status: params.get("status") ?? undefined,
        businessType: params.get("businessType") ?? undefined,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    return jsonOk(await createSellerApplication(await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
