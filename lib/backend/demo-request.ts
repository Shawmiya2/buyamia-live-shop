import {
  canAccessDashboard,
  getAllowedRolesForDashboard,
  normalizeProfileType,
} from "./role-guard";
import type { DashboardType, ProfileType } from "./types";

export type DemoAccessContext = {
  authMode: "demo";
  accessChecked: true;
  allowedRoles: ProfileType[];
  currentRole: ProfileType | null;
  currentUserId: string | null;
  accessGranted: boolean;
};

export function getDemoAccessContext(
  request: Request,
  dashboardType: DashboardType,
): DemoAccessContext {
  const url = new URL(request.url);
  const role =
    normalizeProfileType(request.headers.get("x-demo-profile-type")) ??
    normalizeProfileType(url.searchParams.get("profileType"));
  const userId =
    request.headers.get("x-demo-user-id") ?? url.searchParams.get("userId");

  return {
    authMode: "demo",
    accessChecked: true,
    allowedRoles: getAllowedRolesForDashboard(dashboardType),
    currentRole: role,
    currentUserId: userId,
    accessGranted: role ? canAccessDashboard(role, dashboardType) : true,
  };
}
