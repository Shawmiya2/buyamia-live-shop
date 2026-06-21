import type { DashboardType, ProfileType } from "./types";

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

export const profileTypes: ProfileType[] = [
  "main_admin",
  "hotel",
  "restaurant",
  "supplier",
  "service_provider",
  "viewer",
];

export function normalizeProfileType(value: unknown): ProfileType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return isValidProfileType(normalized) ? normalized : null;
}

export function isValidProfileType(value: unknown): value is ProfileType {
  return (
    typeof value === "string" && profileTypes.includes(value as ProfileType)
  );
}

export function getDashboardForRole(profileType: ProfileType) {
  return roleDashboardMap[profileType];
}

export function getAllowedRolesForDashboard(
  dashboardType: DashboardType,
): ProfileType[] {
  const ownerRole = dashboardRoleMap[dashboardType];

  return ownerRole === "main_admin" ? ["main_admin"] : ["main_admin", ownerRole];
}

export function canAccessDashboard(
  profileType: ProfileType,
  dashboardType: DashboardType,
) {
  return getAllowedRolesForDashboard(dashboardType).includes(profileType);
}

export function assertDashboardAccess(
  profileType: ProfileType,
  dashboardType: DashboardType,
) {
  if (!canAccessDashboard(profileType, dashboardType)) {
    if (dashboardType === "main") {
      throw new Error("This dashboard is reserved for main administrators.");
    }

    const dashboardRole = dashboardRoleMap[dashboardType];
    throw new Error(`This dashboard is for ${dashboardRole} partners.`);
  }
}

export function getDashboardAccessLabel(dashboardType: DashboardType) {
  return dashboardRoleMap[dashboardType].replace(/_/g, " ");
}

export function isProviderRole(role: ProfileType) {
  return (
    role === "hotel" ||
    role === "restaurant" ||
    role === "supplier" ||
    role === "service_provider"
  );
}
