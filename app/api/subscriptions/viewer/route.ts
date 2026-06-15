import { jsonError, jsonOk } from "@/lib/backend/api-response";
import {
  getAvailableProvidersForViewer,
  getFollowedProviders,
  getViewerReplayFeed,
  getViewerUpcomingLives,
} from "@/lib/backend/subscription-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewerUserId = searchParams.get("viewerUserId") ?? "user_viewer_mock";

    return jsonOk({
      viewerUserId,
      followedProviders: getFollowedProviders(viewerUserId),
      replayFeed: getViewerReplayFeed(viewerUserId),
      upcomingLives: getViewerUpcomingLives(viewerUserId),
      availableProviders: getAvailableProvidersForViewer(viewerUserId),
    });
  } catch (error) {
    return jsonError(error);
  }
}
