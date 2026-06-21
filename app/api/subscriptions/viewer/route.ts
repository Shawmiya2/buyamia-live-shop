import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireRole } from "@/lib/backend/auth-context";
import {
  getAvailableProvidersForViewer,
  getFollowedProviders,
  getViewerReplayFeed,
  getViewerUpcomingLives,
} from "@/lib/backend/subscription-service";

export async function GET() {
  try {
    const viewer = await requireRole("viewer");

    return jsonOk({
      viewerUserId: viewer.id,
      followedProviders: await getFollowedProviders(viewer.id),
      replayFeed: await getViewerReplayFeed(viewer.id),
      upcomingLives: await getViewerUpcomingLives(viewer.id),
      availableProviders: await getAvailableProvidersForViewer(viewer.id),
    });
  } catch (error) {
    return jsonError(error);
  }
}
