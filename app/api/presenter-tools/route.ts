import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { listAvailablePresenterTools } from "@/lib/backend/presenter-tool-service";

export async function GET() {
  try {
    return jsonOk(await listAvailablePresenterTools());
  } catch (error) {
    return jsonError(error);
  }
}
