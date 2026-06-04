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
  verificationStatus: VerificationStatus;
  liveStats: LiveStats;
  replayStats: ReplayStats;
  pinnedLives: LiveEvent[];
  subscriptions?: {
    followedProviders?: Provider[];
    replayFeed?: LiveEvent[];
    followerCount?: number;
  };
  analyticsSummary: AnalyticsSummary;
  nextActions: string[];
};

export type AccountCreationResponse = {
  userId: string;
  name: string;
  email: string;
  profileType: ProfileType;
  dashboardUrl: string;
  verificationStatus: VerificationStatus;
  onboardingStatus: OnboardingStatus;
};
