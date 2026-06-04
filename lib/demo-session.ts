"use client";

import type { AccountCreationResponse, DemoSession } from "./backend/types";
import type { ProfileType } from "./backend/types";

export const demoSessionStorageKey = "buyamia.demoSession";

const demoRoleDashboardMap: Record<ProfileType, string> = {
  main_admin: "/dashboard/main",
  hotel: "/dashboard/hotel",
  restaurant: "/dashboard/restaurant",
  supplier: "/dashboard/supplier",
  service_provider: "/dashboard/services",
  viewer: "/dashboard/viewer",
};

export function createDemoSession(
  account: AccountCreationResponse,
): DemoSession {
  return {
    userId: account.userId,
    name: account.name,
    email: account.email,
    profileType: account.profileType,
    dashboardUrl: account.dashboardUrl,
    verificationStatus: account.verificationStatus,
    onboardingStatus: account.onboardingStatus,
  };
}

export function createDemoSessionForRole(profileType: ProfileType): DemoSession {
  const label = profileType.replace(/_/g, " ");

  return {
    userId: `demo_${profileType}`,
    name: `Demo ${label}`,
    email: `${profileType.replace(/_/g, "-")}@demo.local`,
    profileType,
    dashboardUrl: demoRoleDashboardMap[profileType],
    verificationStatus:
      profileType === "main_admin" || profileType === "viewer"
        ? "not_started"
        : "pending",
    onboardingStatus: "in_progress",
  };
}

export function saveDemoSession(session: DemoSession) {
  // Demo-only browser state. localStorage is not secure authentication and must
  // be replaced by a real auth/session provider before production use.
  window.localStorage.setItem(demoSessionStorageKey, JSON.stringify(session));
}

export function clearDemoSession() {
  window.localStorage.removeItem(demoSessionStorageKey);
}

export function readDemoSession(): DemoSession | null {
  try {
    const raw = window.localStorage.getItem(demoSessionStorageKey);

    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}
