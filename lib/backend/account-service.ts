import { roleDashboardMap, users } from "./mock-data";
import type { AccountCreationResponse, MockUser, ProfileType } from "./types";

export const profileTypes: ProfileType[] = [
  "main_admin",
  "hotel",
  "restaurant",
  "supplier",
  "service_provider",
  "viewer",
];

export function isProfileType(value: unknown): value is ProfileType {
  return typeof value === "string" && profileTypes.includes(value as ProfileType);
}

export function getDashboardUrl(profileType: ProfileType) {
  return roleDashboardMap[profileType];
}

export function createMockAccount(input: {
  profileType: unknown;
  name?: unknown;
  displayName?: unknown;
  email?: unknown;
}): AccountCreationResponse {
  if (!isProfileType(input.profileType)) {
    throw new Error("Invalid profile type.");
  }

  const index = users.length + 1;
  const user: MockUser = {
    id: `user_mock_${index}`,
    displayName:
      typeof input.displayName === "string" && input.displayName.trim()
        ? input.displayName.trim()
        : typeof input.name === "string" && input.name.trim()
          ? input.name.trim()
        : "New Buyamia User",
    email:
      typeof input.email === "string" && input.email.trim()
        ? input.email.trim()
        : `mock-user-${index}@example.test`,
    profileType: input.profileType,
    verificationStatus:
      input.profileType === "viewer" || input.profileType === "main_admin"
        ? "not_started"
        : "pending",
    onboardingStatus: "in_progress",
  };

  users.push(user);

  return {
    userId: user.id,
    profileType: user.profileType,
    dashboardUrl: getDashboardUrl(user.profileType),
    verificationStatus: user.verificationStatus,
    onboardingStatus: user.onboardingStatus,
  };
}
