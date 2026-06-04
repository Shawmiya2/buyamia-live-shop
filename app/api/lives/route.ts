import { jsonOk } from "@/lib/backend/api-response";
import { getLives } from "@/lib/backend/live-service";

export async function GET() {
  return jsonOk({
    lives: getLives(),
  });
}
