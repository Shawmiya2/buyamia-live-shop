import {
  getDashboardForRole,
  isValidProfileType,
} from "./role-guard";
import { createAnalyticsEvent, updateBackendStore } from "./store";
import type { AccountCreationResponse, MockUser, ProfileType } from "./types";

export function isProfileType(value: unknown): value is ProfileType {
  return isValidProfileType(value);
}

export function getDashboardUrl(profileType: ProfileType) {
  return getDashboardForRole(profileType);
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

  const profileType = input.profileType;
  const user = updateBackendStore((store) => {
    const index = store.users.length + 1;
    const cleanName =
      typeof input.displayName === "string" && input.displayName.trim()
        ? input.displayName.trim()
        : typeof input.name === "string" && input.name.trim()
          ? input.name.trim()
          : "New Buyamia User";
    const userId = `user_demo_${Date.now()}_${index}`;
    const nextUser: MockUser = {
      id: userId,
      displayName: cleanName,
      email:
        typeof input.email === "string" && input.email.trim()
          ? input.email.trim()
          : `mock-user-${index}@example.test`,
      profileType,
      verificationStatus:
        profileType === "viewer" || profileType === "main_admin"
          ? "not_started"
          : "pending",
      onboardingStatus: "in_progress",
    };

    if (
      profileType !== "viewer" &&
      profileType !== "main_admin"
    ) {
      const providerId = `provider_demo_${profileType}_${Date.now()}`;
      nextUser.providerId = providerId;
      store.providers.push({
        id: providerId,
        ownerUserId: userId,
        name: cleanName,
        profileType,
        verificationStatus: nextUser.verificationStatus,
      });
    }

    store.users.push(nextUser);
    store.analyticsEvents.push(
      createAnalyticsEvent({
        type: "account_created",
        userId,
        providerId: nextUser.providerId,
        metadata: { profileType },
      }),
    );

    return nextUser;
  });

  return {
    userId: user.id,
    name: user.displayName,
    email: user.email,
    profileType: user.profileType,
    dashboardUrl: getDashboardUrl(user.profileType),
    verificationStatus: user.verificationStatus,
    onboardingStatus: user.onboardingStatus,
  };
}
