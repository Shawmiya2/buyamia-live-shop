import { jsonError, jsonOk } from "@/lib/backend/api-response";
import { requireAuthenticatedUser } from "@/lib/backend/auth-context";
import { providerForCurrentUser } from "@/lib/backend/dashboard-service";
import { createLiveRequest, listLiveRequests } from "@/lib/backend/live-request-service";
import { readJson } from "@/lib/backend/validation";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const providerId = await providerForCurrentUser(user);
    return jsonOk({ requests: await listLiveRequests({ providerId }) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const providerId = await providerForCurrentUser(user);
    const body = await readJson(request);
    return jsonOk(
      await createLiveRequest(providerId, {
        title: body.title ?? body.serviceName,
        category: body.category ?? body.serviceCategory,
        description: body.description ?? body.shortDescription,
        preferredDate: body.preferredDate ?? body.preferredLiveDate,
        documentMetadata: body.documentMetadata,
      }),
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
