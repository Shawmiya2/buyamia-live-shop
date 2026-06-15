import { createAnalyticsEvent, readBackendStore, updateBackendStore } from "./store";
import type { ServiceLiveSetupRequest } from "./types";

function cleanRequired(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export function createServiceLiveSetupRequest(input: {
  userId?: unknown;
  providerId?: unknown;
  serviceName?: unknown;
  serviceCategory?: unknown;
  shortDescription?: unknown;
  preferredLiveDate?: unknown;
}) {
  return updateBackendStore((store) => {
    const provider =
      typeof input.providerId === "string"
        ? store.providers.find((item) => item.id === input.providerId)
        : typeof input.userId === "string"
          ? store.providers.find((item) => item.ownerUserId === input.userId)
          : store.providers.find((item) => item.profileType === "service_provider");

    if (!provider) {
      throw new Error("Service provider not found.");
    }

    const preferredLiveDate = cleanRequired(
      input.preferredLiveDate,
      "preferredLiveDate",
    );
    const request: ServiceLiveSetupRequest = {
      id: `service_request_${Date.now()}`,
      providerId: provider.id,
      ownerUserId: provider.ownerUserId,
      serviceName: cleanRequired(input.serviceName, "serviceName"),
      serviceCategory: cleanRequired(input.serviceCategory, "serviceCategory"),
      shortDescription: cleanRequired(
        input.shortDescription,
        "shortDescription",
      ),
      documentVerificationPlaceholder: "Document metadata received",
      paymentPlaceholder: "Payment placeholder: not connected",
      preferredLiveDate,
      status:
        provider.verificationStatus === "verified"
          ? "ready_to_schedule"
          : "pending_verification",
      createdAt: new Date().toISOString(),
    };

    store.serviceLiveSetupRequests.unshift(request);
    store.analyticsEvents.push(
      createAnalyticsEvent({
        type: "service_live_requested",
        userId: provider.ownerUserId,
        providerId: provider.id,
        metadata: { status: request.status },
      }),
    );

    return request;
  });
}

export function getServiceLiveSetupRequests(providerId?: string) {
  const requests = readBackendStore().serviceLiveSetupRequests;

  return providerId
    ? requests.filter((request) => request.providerId === providerId)
    : requests;
}
