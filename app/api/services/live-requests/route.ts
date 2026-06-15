import { jsonError, jsonOk } from "@/lib/backend/api-response";
import {
  createServiceLiveSetupRequest,
  getServiceLiveSetupRequests,
} from "@/lib/backend/service-request-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") ?? undefined;

    return jsonOk({
      requests: getServiceLiveSetupRequests(providerId),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return jsonOk(createServiceLiveSetupRequest(body), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
