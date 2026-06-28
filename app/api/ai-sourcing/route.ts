import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { createAiSourcingRequest } from "@/lib/backend/ai-sourcing-service";
import { readJson } from "@/lib/backend/validation";

export async function POST(request: Request) {
  try {
    return jsonOk(await createAiSourcingRequest(await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
