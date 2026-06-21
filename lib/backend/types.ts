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

export type LiveEvent = {
  id: string;
  providerId: string;
  providerName: string;
  providerRole: Exclude<ProfileType, "main_admin" | "viewer">;
  title: string;
  status: "scheduled" | "live" | "replay";
  startsAt: string;
  viewerCount: number;
  replayViews: number;
  conversionIntent: number;
  isPinned: boolean;
  pinReason?: PinReason;
  pinExpiresAt?: string;
  priorityScore: number;
  replay: LiveReplay;
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
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
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
};

export type ViewerAnalyticsSummary = {
  followedProviders: number;
  upcomingLives: number;
  availableReplays: number;
  watchedLives: number;
};

export type MainAnalyticsSummary = {
  totalUsers: number;
  totalProviders: number;
  activeLives: number;
  pinnedLives: number;
  pendingVerifications: number;
  expiringReplays: number;
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
