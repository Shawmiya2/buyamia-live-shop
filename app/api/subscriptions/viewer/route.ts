import { jsonError, jsonOk } from "@/lib/backend/api-response";
import {
  getFollowedProviders,
  getViewerReplayFeed,
} from "@/lib/backend/subscription-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewerUserId = searchParams.get("viewerUserId") ?? "user_viewer_mock";

    return jsonOk({
      viewerUserId,
      followedProviders: getFollowedProviders(viewerUserId),
      replayFeed: getViewerReplayFeed(viewerUserId),
    });
  } catch (error) {
    return jsonError(error);
  }
}
