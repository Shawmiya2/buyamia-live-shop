import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getLiveDetailsById } from "@/lib/backend/live-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return jsonOk(await getLiveDetailsById((await params).id));
  } catch (error) {
    return jsonError(error);
  }
}
