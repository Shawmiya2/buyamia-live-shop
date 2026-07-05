import { jsonError, jsonOk } from "@/lib/backend/api-response";
import {
  computeSuggestedTools,
  listActiveToolsForLive,
  listRecentToolActivations,
} from "@/lib/backend/presenter-tool-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [active, recent, suggestions] = await Promise.all([
      listActiveToolsForLive(id),
      listRecentToolActivations(id),
      computeSuggestedTools(id),
    ]);

    return jsonOk({ active, recent, suggestions });
  } catch (error) {
    return jsonError(error);
  }
}
