import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import { generateReviewBrief, listHotelProvidersForReviewBrief, listReviewBriefs } from "@/lib/backend/review-brief-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireRole("main_admin", "hotel");
    const hotels = await listHotelProvidersForReviewBrief(user);
    const briefs = await listReviewBriefs(user.role === "hotel" ? user.providerId : undefined);
    return jsonOk({ hotels, briefs });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("main_admin", "hotel");
    return jsonOk(await generateReviewBrief(user, await readJson(request)), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
