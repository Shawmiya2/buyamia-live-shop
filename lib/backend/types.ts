export type ProfileType =
  | "main_admin"
  | "hotel"
  | "restaurant"
  | "supplier"
  | "service_provider"
  | "viewer";

export type DashboardType =
  | "main"
  | "hotel"
  | "restaurant"
  | "supplier"
  | "services"
  | "viewer";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "rejected"
  | "needs_more_info";

export type OnboardingStatus = "not_started" | "in_progress" | "complete";

export type ReplayStatus = "active" | "expiring_soon" | "expired";

export type PinReason =
  | "sponsored"
  | "nearby"
  | "most_watched"
  | "featured_by_buyamia";

export type VerificationDocumentMetadata = {
  documentType: string;
  uploadedAt: string;
  status: VerificationStatus;
  reviewNote: string;
};

export type ServiceLiveSetupStatus =
  | "draft"
  | "pending_verification"
  | "ready_to_schedule";

export type LiveRequestStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "active"
  | "completed"
  | "canceled";

export type MockUser = {
  id: string;
  displayName: string;
  email: string;
  profileType: ProfileType;
  verificationStatus: VerificationStatus;
  onboardingStatus: OnboardingStatus;
  providerId?: string;
};

export type DemoSession = {
  userId: string;
  name: string;
  email: string;
  profileType: ProfileType;
  dashboardUrl: string;
  verificationStatus: VerificationStatus;
  onboardingStatus: OnboardingStatus;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: ProfileType;
  verificationStatus: VerificationStatus;
  onboardingStatus: OnboardingStatus;
  dashboardUrl: string;
  providerId?: string;
};

export type Provider = {
  id: string;
  ownerUserId: string;
  name: string;
  profileType: Exclude<ProfileType, "main_admin" | "viewer">;
  verificationStatus: VerificationStatus;
};

export type LiveReplay = {
  availableFrom: string;
  expiresAt: string;
  daysRemaining: number;
  status: ReplayStatus;
  extensionAvailable: boolean;
  extensionDays: number;
  planLabel: string;
  priceLabel: string;
};

export type ReplayTranscriptTag =
  | "product"
  | "MOQ"
  | "shipping"
  | "pricing"
  | "quality"
  | "RFQ";

export type LiveIntentQuestionStatus = "unanswered" | "answered" | "escalated";

export type LiveIntentCategory =
  | "MOQ"
  | "shipping"
  | "pricing"
  | "quality"
  | "comparison"
  | "hesitation"
  | "rejection"
  | "bundle_request"
  | "availability"
  | "policy";

export type SpecialistHostType =
  | "supplier host"
  | "procurement specialist"
  | "interior designer"
  | "hospitality consultant"
  | "product expert"
  | "sourcing agent";

export type SpecialistHost = {
  hostType: SpecialistHostType;
  expertiseArea: string;
  verified: boolean;
  bio: string;
};

export type LiveCommerceProduct = {
  name: string;
  variant: string;
  moq: string;
  inventory: string;
  promotion?: string;
  shippingAvailability: string;
  serviceAvailability: string;
  policySummary: string;
};

export type LiveCommerceData = {
  summary: string;
  products: LiveCommerceProduct[];
  policies: string[];
  serviceAvailability: string[];
};

export type LiveIntentQuestion = {
  id: string;
  buyerName: string;
  question: string;
  timestamp: string;
  intentCategory: LiveIntentCategory;
  status: LiveIntentQuestionStatus;
};

export type ReplayTranscriptSegment = {
  id: string;
  timestamp: string;
  seconds: number;
  speaker: string;
  text: string;
  tags?: ReplayTranscriptTag[];
};

export type SupplierTrustBreakdownItem = {
  label: string;
  value: string;
  points: number;
  maxPoints: number;
  detail: string;
};

export type SupplierTrustScore = {
  score: number;
  label: string;
  completedOrders: number;
  responseRate: number;
  averageResponseMinutes: number;
  certifications: string[];
  bImpactScore: number;
  completedLiveSessions: number;
  certifiedReviews: number;
  breakdown: SupplierTrustBreakdownItem[];
};

export type LiveEvent = {
  id: string;
  providerId: string;
  providerName: string;
  providerRole: Exclude<ProfileType, "main_admin" | "viewer">;
  title: string;
  category: string;
  status: "scheduled" | "live" | "replay";
  startsAt: string;
  viewerCount: number;
  replayViews: number;
  conversionIntent: number;
  isPinned: boolean;
  pinReason?: PinReason;
  pinExpiresAt?: string;
  priorityScore: number;
  trustScore: SupplierTrustScore;
  transcript: ReplayTranscriptSegment[];
  specialistHost?: SpecialistHost;
  commerceData?: LiveCommerceData;
  intentQuestions?: LiveIntentQuestion[];
  replay: LiveReplay;
};

export type LivePagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type LiveListResponse = {
  items: LiveEvent[];
  pagination: LivePagination;
  activePinnedCount: number;
};

export type FeaturedSupplierCategory =
  | "Recommended"
  | "Popular"
  | "Nearby"
  | "Sponsored"
  | "New verified suppliers";

export type FeaturedSupplierSession = LiveEvent & {
  featureCategory: FeaturedSupplierCategory;
  featureReason: string;
  featureBadge: string;
};

export type AssistantMode = "local" | "provider";

export type AssistantAction = {
  id: string;
  title: string;
  href: string;
  description: string;
  category: "command" | "search" | "help";
};

export type AssistantSearchResult = {
  id: string;
  title: string;
  href: string;
  context: string;
  type: "live" | "provider" | "rfq" | "live_request";
};

export type AssistantResponse = {
  mode: AssistantMode;
  providerConfigured: boolean;
  providerHealthy: boolean;
  role: ProfileType | null;
  query: string;
  recognizedAction?: AssistantAction;
  actions: AssistantAction[];
  results: AssistantSearchResult[];
  suggestions: AssistantAction[];
  message: string;
};

export type Subscription = {
  viewerUserId: string;
  providerId: string;
  followedAt: string;
};

export type ServiceLiveSetupRequest = {
  id: string;
  providerId: string;
  title: string;
  category: string;
  description: string;
  preferredDate: string | Date;
  status: LiveRequestStatus;
  adminNote?: string | null;
  createdAt: string | Date;
  provider?: {
    displayName: string;
    category: ProfileType;
    user: {
      name: string;
      role: ProfileType;
    };
  };
};

export type DemoAnalyticsEvent = {
  id: string;
  type: "account_created" | "followed_provider" | "unfollowed_provider" | "replay_extended" | "live_pinned" | "live_unpinned" | "verification_updated" | "service_live_requested" | "watched_live";
  userId?: string;
  providerId?: string;
  liveId?: string;
  conversionSource?: ConversionAttributionSource;
  conversionIntent?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ConversionAttributionSource =
  | "live"
  | "replay"
  | "linkedin"
  | "agent_referral"
  | "highlight_video"
  | "shared_link"
  | "direct_dashboard";

export type ConversionAttributionIntent = {
  intent: string;
  label: string;
  conversions: number;
};

export type ConversionAttributionSourceSummary = {
  source: ConversionAttributionSource;
  label: string;
  conversions: number;
  conversionRate: number;
  intentLabel: string;
  assistedRevenueLabel: string;
  changeLabel: string;
};

export type ConversionAttributionSummary = {
  totalConversions: number;
  topChannel: ConversionAttributionSourceSummary;
  sources: ConversionAttributionSourceSummary[];
  intentBySource: {
    source: ConversionAttributionSource;
    label: string;
    totalConversions: number;
    intents: ConversionAttributionIntent[];
  }[];
};

export type IntentInsightsSummary = {
  totalSignals: number;
  topBuyerIntent: {
    label: string;
    count: number;
    detail: string;
  };
  mostCommonHesitation: {
    label: string;
    count: number;
    detail: string;
  };
  mostComparedProducts: {
    label: string;
    count: number;
    detail: string;
  };
  bundleRequests: {
    label: string;
    count: number;
    detail: string;
  };
  rejectedReasons: {
    label: string;
    count: number;
  }[];
  rfqSampleIntent: {
    rfq: number;
    sample: number;
    detail: string;
  };
};

export type ProcurementAgentReferralRow = {
  liveId: string;
  title: string;
  providerName: string;
  providerRole: Exclude<ProfileType, "main_admin" | "viewer">;
  category: string;
  sessionLabel: string;
  referralSourceLabel: string;
  referralLink: string;
  clicks: number;
  referredSessions: number;
  attributedRfqs: number;
  attributedOrders: number;
  estimatedCommission: number;
  conversionRate: number;
};

export type ProcurementAgentDashboardData = {
  shareableSessions: Array<FeaturedSupplierSession & { referralLink: string }>;
  totalClicks: number;
  referredSessions: number;
  attributedRfqs: number;
  attributedOrders: number;
  estimatedCommission: number;
  conversionRate: number;
  topPerformingLive: ProcurementAgentReferralRow | null;
  referredLives: ProcurementAgentReferralRow[];
  conversionAttribution: ConversionAttributionSummary;
};

export type LiveStats = {
  totalLives: number;
  activeLives: number;
  scheduledLives: number;
};

export type ReplayStats = {
  replayViews: number;
  availableReplays: number;
  expiringReplays: number;
};

export type ProviderAnalyticsSummary = {
  totalLives: number;
  activeLives: number;
  replayViews: number;
  followers: number;
  conversionIntent: number;
  verificationStatus: VerificationStatus;
  conversionAttribution: ConversionAttributionSummary;
  intentInsights: IntentInsightsSummary;
};

export type ViewerAnalyticsSummary = {
  followedProviders: number;
  upcomingLives: number;
  availableReplays: number;
  watchedLives: number;
  conversionAttribution: ConversionAttributionSummary;
  intentInsights: IntentInsightsSummary;
};

export type MainAnalyticsSummary = {
  totalUsers: number;
  totalProviders: number;
  activeLives: number;
  pinnedLives: number;
  pendingVerifications: number;
  expiringReplays: number;
  conversionAttribution: ConversionAttributionSummary;
  intentInsights: IntentInsightsSummary;
};

export type AnalyticsSummary =
  | ProviderAnalyticsSummary
  | ViewerAnalyticsSummary
  | MainAnalyticsSummary;

export type DashboardResponse = {
  dashboardType: DashboardType;
  role: ProfileType;
  auth?: {
    authMode: "demo";
    accessChecked: true;
    allowedRoles: ProfileType[];
    currentRole: ProfileType | null;
    currentUserId: string | null;
    accessGranted: boolean;
  };
  currentUserId?: string;
  providerId?: string;
  verificationStatus: VerificationStatus;
  liveStats: LiveStats;
  replayStats: ReplayStats;
  liveCatalog?: LiveEvent[];
  pinnedLives: LiveEvent[];
  subscriptions?: {
    followedProviders?: Provider[];
    replayFeed?: LiveEvent[];
    upcomingLives?: LiveEvent[];
    availableProviders?: Provider[];
    followerCount?: number;
  };
  serviceLiveSetupRequests?: ServiceLiveSetupRequest[];
  pendingLiveRequests?: ServiceLiveSetupRequest[];
  analyticsSummary: AnalyticsSummary;
  nextActions: string[];
};

export type AccountCreationResponse = {
  userId: string;
  user?: SafeUser;
  name: string;
  email: string;
  profileType: ProfileType;
  role?: ProfileType;
  dashboardUrl: string;
  verificationStatus: VerificationStatus;
  onboardingStatus: OnboardingStatus;
};
