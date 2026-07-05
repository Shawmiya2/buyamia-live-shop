export type LastMileAdapterKind =
  | "delivery"
  | "payment"
  | "insurance"
  | "kyc"
  | "livestream";

export type LastMileAdapterStatus = {
  kind: LastMileAdapterKind;
  providerName: string;
  configured: false;
  demoMode: true;
  status: "provider_not_configured";
  nextStepRequired: string;
};

function localAdapter(kind: LastMileAdapterKind, providerName: string, nextStepRequired: string): LastMileAdapterStatus {
  return {
    kind,
    providerName,
    configured: false,
    demoMode: true,
    status: "provider_not_configured",
    nextStepRequired,
  };
}

export const deliveryProviderAdapter = localAdapter(
  "delivery",
  "Local logistics provider",
  "Connect a delivery or logistics provider before creating real shipments.",
);

export const paymentProviderAdapter = localAdapter(
  "payment",
  "Payment provider",
  "Connect a payment provider before collecting or authorizing payments.",
);

export const insuranceProviderAdapter = localAdapter(
  "insurance",
  "Insurance provider",
  "Connect an insurance provider before offering protected cover.",
);

export const kycProviderAdapter = localAdapter(
  "kyc",
  "KYC provider",
  "Connect a KYC provider before running identity or business verification.",
);

export const livestreamProviderAdapter = localAdapter(
  "livestream",
  "Livestream provider",
  "Connect a livestream provider before sending concierge events to a live platform.",
);

export function getLastMileAdapterRoadmap() {
  return {
    mode: "local_demo",
    providerCallsEnabled: false,
    adapters: [
      deliveryProviderAdapter,
      paymentProviderAdapter,
      insuranceProviderAdapter,
      kycProviderAdapter,
      livestreamProviderAdapter,
    ],
  };
}
