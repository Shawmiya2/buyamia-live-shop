import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { createMockAccount } from "@/lib/backend/account-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return jsonOk(createMockAccount(body), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
