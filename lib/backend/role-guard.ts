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

export function canSeeAdminControls(profileType: ProfileType | null | undefined) {
  return profileType === "main_admin";
}

export function canSeeGlobalLiveControls(profileType: ProfileType | null | undefined) {
  return canSeeAdminControls(profileType);
}

export function getVisibleDashboardSections(profileType: ProfileType | null | undefined) {
  if (!profileType) {
    return ["public_discovery"];
  }

  if (canSeeAdminControls(profileType)) {
    return ["public_discovery", "main", "hotel", "restaurant", "supplier", "services", "viewer"];
  }

  return ["public_discovery", dashboardRoleMapKey(profileType)].filter(Boolean);
}

export function getDashboardNavigationForRole(profileType: ProfileType | null | undefined) {
  const publicDiscovery = { label: "Public discovery", href: "/", kind: "overview" };

  if (!profileType) {
    return [publicDiscovery];
  }

  if (canSeeAdminControls(profileType)) {
    return [
      publicDiscovery,
      { label: "Main dashboard", href: "/dashboard/main", kind: "procurement" },
      { label: "Hotel dashboard", href: "/dashboard/hotel", kind: "hotel" },
      { label: "Restaurant dashboard", href: "/dashboard/restaurant", kind: "restaurant" },
      { label: "Supplier dashboard", href: "/dashboard/supplier", kind: "supplier" },
      { label: "Services dashboard", href: "/dashboard/services", kind: "services" },
      { label: "Viewer account", href: "/dashboard/viewer", kind: "traveler" },
    ] as const;
  }

  const dashboardHref = getDashboardForRole(profileType);
  const labels: Record<ProfileType, string> = {
    main_admin: "Main dashboard",
    hotel: "Hotel dashboard",
    restaurant: "Restaurant dashboard",
    supplier: "Supplier dashboard",
    service_provider: "Services dashboard",
    viewer: "Viewer dashboard",
  };

  const kinds: Record<ProfileType, string> = {
    main_admin: "procurement",
    hotel: "hotel",
    restaurant: "restaurant",
    supplier: "supplier",
    service_provider: "services",
    viewer: "traveler",
  };

  return [
    publicDiscovery,
    { label: labels[profileType], href: dashboardHref, kind: kinds[profileType] },
  ] as const;
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

function dashboardRoleMapKey(profileType: ProfileType) {
  if (profileType === "main_admin") return "main";
  if (profileType === "service_provider") return "services";
  if (profileType === "viewer") return "viewer";
  return profileType;
}
