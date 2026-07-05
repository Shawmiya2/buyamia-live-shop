import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { getConciergeRoadmap } from "@/lib/backend/concierge-service";

export async function GET() {
  try {
    return jsonOk(await getConciergeRoadmap());
  } catch (error) {
    return jsonError(error);
  }
}
