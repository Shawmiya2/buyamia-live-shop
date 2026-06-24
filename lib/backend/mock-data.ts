import type {
  DashboardType,
  LiveEvent,
  MockUser,
  ProfileType,
  Provider,
  ReplayTranscriptSegment,
  Subscription,
  VerificationDocumentMetadata,
} from "./types";
import {
  createDemoCommerceData,
  createDemoLiveQuestions,
  createDemoSpecialistHost,
} from "./live-service";
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
const demoTrustScore = {
  score: 92,
  label: "Verified Trust Score",
  completedOrders: 84,
  responseRate: 94,
  averageResponseMinutes: 28,
  certifications: ["Demo verified", "Local proof"],
  bImpactScore: 82,
  completedLiveSessions: 4,
  certifiedReviews: 41,
  breakdown: [
    {
      label: "Verification",
      value: "verified",
      points: 20,
      maxPoints: 20,
      detail: "Demo provider verification signal.",
    },
  ],
};

function daysFromNow(days: number) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function transcriptForDemoLive(liveId: string, providerName: string, title: string): ReplayTranscriptSegment[] {
  return [
    {
      id: `${liveId}-transcript-1`,
      timestamp: "0:00",
      seconds: 0,
      speaker: providerName,
      text: `Welcome to ${title}. We will cover product proof, MOQ, shipping, pricing, and RFQ follow-up.`,
      tags: ["product"],
    },
    {
      id: `${liveId}-transcript-2`,
      timestamp: "1:18",
      seconds: 78,
      speaker: "Buyamia AI",
      text: "Key product moment saved for replay buyers and supplier comparison.",
      tags: ["product"],
    },
    {
      id: `${liveId}-transcript-3`,
      timestamp: "2:12",
      seconds: 132,
      speaker: providerName,
      text: "MOQ can be split across related items when the buyer sends a combined RFQ.",
      tags: ["MOQ", "RFQ"],
    },
    {
      id: `${liveId}-transcript-4`,
      timestamp: "3:38",
      seconds: 218,
      speaker: providerName,
      text: "Shipping can be quoted as FOB or CIF with export packing and lead-time confirmation.",
      tags: ["shipping"],
    },
    {
      id: `${liveId}-transcript-5`,
      timestamp: "5:01",
      seconds: 301,
      speaker: "Buyer",
      text: "Please show finish quality, material thickness, and sample proof before quote approval.",
      tags: ["quality"],
    },
    {
      id: `${liveId}-transcript-6`,
      timestamp: "6:12",
      seconds: 372,
      speaker: providerName,
      text: "Pricing depends on order tier, packaging, and route assumptions.",
      tags: ["pricing"],
    },
    {
      id: `${liveId}-transcript-7`,
      timestamp: "7:43",
      seconds: 463,
      speaker: "Buyamia AI",
      text: "RFQ and sample request fields are ready with MOQ, shipping, pricing, and quality notes.",
      tags: ["RFQ", "MOQ", "shipping", "pricing", "quality"],
    },
  ];
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
    category: "Hotels",
    status: "live",
    startsAt: daysFromNow(0),
    viewerCount: 1820,
    replayViews: 12400,
    conversionIntent: 19,
    isPinned: true,
    pinReason: "featured_by_buyamia",
    pinExpiresAt: daysFromNow(2),
    priorityScore: 96,
    trustScore: demoTrustScore,
    transcript: transcriptForDemoLive("live_hotel_ocean_suite", "Sanur Wellness Hotel", "Ocean suite sunset walkthrough"),
    specialistHost: createDemoSpecialistHost({
      providerName: "Sanur Wellness Hotel",
      providerCategory: "hotel",
      category: "Hotels",
      title: "Ocean suite sunset walkthrough",
    }),
    commerceData: createDemoCommerceData({
      providerName: "Sanur Wellness Hotel",
      category: "hotel",
      title: "Ocean suite sunset walkthrough",
    }),
    intentQuestions: createDemoLiveQuestions({
      liveId: "live_hotel_ocean_suite",
      providerName: "Sanur Wellness Hotel",
      category: "Hotels",
      title: "Ocean suite sunset walkthrough",
    }),
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
    category: "Food & Brunch",
    status: "live",
    startsAt: daysFromNow(0),
    viewerCount: 2460,
    replayViews: 9800,
    conversionIntent: 24,
    isPinned: true,
    pinReason: "most_watched",
    pinExpiresAt: daysFromNow(1),
    priorityScore: 92,
    trustScore: demoTrustScore,
    transcript: transcriptForDemoLive("live_restaurant_tasting", "Seminyak Chef Table", "Chef tasting and table availability"),
    specialistHost: createDemoSpecialistHost({
      providerName: "Seminyak Chef Table",
      providerCategory: "restaurant",
      category: "Food & Brunch",
      title: "Chef tasting and table availability",
    }),
    commerceData: createDemoCommerceData({
      providerName: "Seminyak Chef Table",
      category: "restaurant",
      title: "Chef tasting and table availability",
    }),
    intentQuestions: createDemoLiveQuestions({
      liveId: "live_restaurant_tasting",
      providerName: "Seminyak Chef Table",
      category: "Food & Brunch",
      title: "Chef tasting and table availability",
    }),
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
    category: "Facilities",
    status: "replay",
    startsAt: daysFromNow(-2),
    viewerCount: 830,
    replayViews: 15800,
    conversionIntent: 31,
    isPinned: true,
    pinReason: "sponsored",
    pinExpiresAt: daysFromNow(3),
    priorityScore: 98,
    trustScore: demoTrustScore,
    transcript: transcriptForDemoLive("live_supplier_factory", "Bali Rattan Works", "Factory audit and rattan lounge set RFQ"),
    specialistHost: createDemoSpecialistHost({
      providerName: "Bali Rattan Works",
      providerCategory: "supplier",
      category: "Facilities",
      title: "Factory audit and rattan lounge set RFQ",
    }),
    commerceData: createDemoCommerceData({
      providerName: "Bali Rattan Works",
      category: "supplier",
      title: "Factory audit and rattan lounge set RFQ",
    }),
    intentQuestions: createDemoLiveQuestions({
      liveId: "live_supplier_factory",
      providerName: "Bali Rattan Works",
      category: "Facilities",
      title: "Factory audit and rattan lounge set RFQ",
    }),
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
    category: "Services",
    status: "scheduled",
    startsAt: daysFromNow(1),
    viewerCount: 210,
    replayViews: 1200,
    conversionIntent: 12,
    isPinned: true,
    pinReason: "nearby",
    pinExpiresAt: daysFromNow(1),
    priorityScore: 74,
    trustScore: demoTrustScore,
    transcript: transcriptForDemoLive("live_service_arrival", "Private Arrival Service", "Airport transfer arrival walkthrough"),
    specialistHost: createDemoSpecialistHost({
      providerName: "Private Arrival Service",
      providerCategory: "service_provider",
      category: "Services",
      title: "Airport transfer arrival walkthrough",
    }),
    commerceData: createDemoCommerceData({
      providerName: "Private Arrival Service",
      category: "service_provider",
      title: "Airport transfer arrival walkthrough",
    }),
    intentQuestions: createDemoLiveQuestions({
      liveId: "live_service_arrival",
      providerName: "Private Arrival Service",
      category: "Services",
      title: "Airport transfer arrival walkthrough",
    }),
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
