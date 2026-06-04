import type {
  DashboardType,
  LiveEvent,
  MockUser,
  ProfileType,
  Provider,
  Subscription,
  VerificationDocumentMetadata,
} from "./types";
import {
  createMockReplayWindow,
  defaultReplayAvailabilityDays,
} from "./replay-policy";

export const roleDashboardMap: Record<ProfileType, string> = {
  main_admin: "/dashboard/main",
  hotel: "/dashboard/hotel",
  restaurant: "/dashboard/restaurant",
  supplier: "/dashboard/supplier",
  service_provider: "/dashboard/services",
  viewer: "/dashboard/viewer",
};

export const dashboardRoleMap: Record<DashboardType, ProfileType> = {
  main: "main_admin",
  hotel: "hotel",
  restaurant: "restaurant",
  supplier: "supplier",
  services: "service_provider",
  viewer: "viewer",
};

// In-memory demo data only. These arrays intentionally model the future service
// boundary without providing production authentication, persistence, or payments.
const now = new Date("2026-06-04T12:00:00.000Z");

function daysFromNow(days: number) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export const users: MockUser[] = [
  {
    id: "user_admin_mock",
    displayName: "Buyamia Ops",
    email: "ops@example.test",
    profileType: "main_admin",
    verificationStatus: "verified",
    onboardingStatus: "complete",
  },
  {
    id: "user_hotel_mock",
    displayName: "Sanur Hotel Partner",
    email: "hotel@example.test",
    profileType: "hotel",
    verificationStatus: "verified",
    onboardingStatus: "complete",
    providerId: "provider_hotel_sanur",
  },
  {
    id: "user_restaurant_mock",
    displayName: "Seminyak Table",
    email: "restaurant@example.test",
    profileType: "restaurant",
    verificationStatus: "pending",
    onboardingStatus: "in_progress",
    providerId: "provider_restaurant_seminyak",
  },
  {
    id: "user_supplier_mock",
    displayName: "Bali Rattan Works",
    email: "supplier@example.test",
    profileType: "supplier",
    verificationStatus: "verified",
    onboardingStatus: "complete",
    providerId: "provider_supplier_rattan",
  },
  {
    id: "user_services_mock",
    displayName: "Private Arrival Service",
    email: "service@example.test",
    profileType: "service_provider",
    verificationStatus: "needs_more_info",
    onboardingStatus: "in_progress",
    providerId: "provider_service_arrival",
  },
  {
    id: "user_viewer_mock",
    displayName: "Mock Viewer",
    email: "viewer@example.test",
    profileType: "viewer",
    verificationStatus: "not_started",
    onboardingStatus: "complete",
  },
];

export const providers: Provider[] = [
  {
    id: "provider_hotel_sanur",
    ownerUserId: "user_hotel_mock",
    name: "Sanur Wellness Hotel",
    profileType: "hotel",
    verificationStatus: "verified",
  },
  {
    id: "provider_restaurant_seminyak",
    ownerUserId: "user_restaurant_mock",
    name: "Seminyak Chef Table",
    profileType: "restaurant",
    verificationStatus: "pending",
  },
  {
    id: "provider_supplier_rattan",
    ownerUserId: "user_supplier_mock",
    name: "Bali Rattan Works",
    profileType: "supplier",
    verificationStatus: "verified",
  },
  {
    id: "provider_service_arrival",
    ownerUserId: "user_services_mock",
    name: "Private Arrival Service",
    profileType: "service_provider",
    verificationStatus: "needs_more_info",
  },
];

export const lives: LiveEvent[] = [
  {
    id: "live_hotel_ocean_suite",
    providerId: "provider_hotel_sanur",
    providerName: "Sanur Wellness Hotel",
    providerRole: "hotel",
    title: "Ocean suite sunset walkthrough",
    status: "live",
    startsAt: daysFromNow(0),
    viewerCount: 1820,
    replayViews: 12400,
    conversionIntent: 19,
    isPinned: true,
    pinReason: "featured_by_buyamia",
    pinExpiresAt: daysFromNow(2),
    priorityScore: 96,
    replay: createMockReplayWindow({
      availableFrom: daysFromNow(-1),
      now,
      availabilityDays: defaultReplayAvailabilityDays,
    }),
  },
  {
    id: "live_restaurant_tasting",
    providerId: "provider_restaurant_seminyak",
    providerName: "Seminyak Chef Table",
    providerRole: "restaurant",
    title: "Chef tasting and table availability",
    status: "live",
    startsAt: daysFromNow(0),
    viewerCount: 2460,
    replayViews: 9800,
    conversionIntent: 24,
    isPinned: true,
    pinReason: "most_watched",
    pinExpiresAt: daysFromNow(1),
    priorityScore: 92,
    replay: createMockReplayWindow({
      availableFrom: daysFromNow(-3),
      now,
      availabilityDays: defaultReplayAvailabilityDays,
    }),
  },
  {
    id: "live_supplier_factory",
    providerId: "provider_supplier_rattan",
    providerName: "Bali Rattan Works",
    providerRole: "supplier",
    title: "Factory audit and rattan lounge set RFQ",
    status: "replay",
    startsAt: daysFromNow(-2),
    viewerCount: 830,
    replayViews: 15800,
    conversionIntent: 31,
    isPinned: true,
    pinReason: "sponsored",
    pinExpiresAt: daysFromNow(3),
    priorityScore: 98,
    replay: createMockReplayWindow({
      availableFrom: daysFromNow(-2),
      now,
      availabilityDays: defaultReplayAvailabilityDays,
      planLabel: "Supplier replay extension",
    }),
  },
  {
    id: "live_service_arrival",
    providerId: "provider_service_arrival",
    providerName: "Private Arrival Service",
    providerRole: "service_provider",
    title: "Airport transfer arrival walkthrough",
    status: "scheduled",
    startsAt: daysFromNow(1),
    viewerCount: 210,
    replayViews: 1200,
    conversionIntent: 12,
    isPinned: true,
    pinReason: "nearby",
    pinExpiresAt: daysFromNow(1),
    priorityScore: 74,
    replay: createMockReplayWindow({
      availableFrom: daysFromNow(-6),
      now,
      availabilityDays: defaultReplayAvailabilityDays,
      planLabel: "Service replay extension",
    }),
  },
];

export const viewerLiveHistory = [
  {
    viewerUserId: "user_viewer_mock",
    liveId: "live_hotel_ocean_suite",
    watchedAt: daysFromNow(-1),
  },
  {
    viewerUserId: "user_viewer_mock",
    liveId: "live_supplier_factory",
    watchedAt: daysFromNow(-2),
  },
  {
    viewerUserId: "user_viewer_mock",
    liveId: "live_restaurant_tasting",
    watchedAt: daysFromNow(-5),
  },
];

export const subscriptions: Subscription[] = [
  {
    viewerUserId: "user_viewer_mock",
    providerId: "provider_hotel_sanur",
    followedAt: daysFromNow(-12),
  },
  {
    viewerUserId: "user_viewer_mock",
    providerId: "provider_supplier_rattan",
    followedAt: daysFromNow(-8),
  },
];

export const verificationDocuments: Record<string, VerificationDocumentMetadata[]> = {
  user_restaurant_mock: [
    {
      documentType: "business_registration_mock",
      uploadedAt: daysFromNow(-2),
      status: "pending",
      reviewNote: "Mock metadata only. Awaiting operations review.",
    },
  ],
  user_services_mock: [
    {
      documentType: "service_license_mock",
      uploadedAt: daysFromNow(-4),
      status: "needs_more_info",
      reviewNote: "Mock metadata only. Address confirmation label is incomplete.",
    },
  ],
};
