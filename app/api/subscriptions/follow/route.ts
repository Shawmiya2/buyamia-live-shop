import { jsonError, jsonOk } from "@/lib/backend/api-response";
import {
  followProvider,
  unfollowProvider,
} from "@/lib/backend/subscription-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return jsonOk(followProvider(body), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    return jsonOk(unfollowProvider(body));
  } catch (error) {
    return jsonError(error);
  }
}
