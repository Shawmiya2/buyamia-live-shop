import { cookies } from "next/headers";
import type { Role, User } from "@prisma/client";
import { ApiError } from "./errors";
import { canAccessDashboard, isProviderRole } from "./role-guard";
import { getUserBySessionToken, safeUser, sessionCookieName } from "./auth-service";
import type { DashboardType, ProfileType, SafeUser } from "./types";

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  const user = await getUserBySessionToken(token);

  return user ? safeUser(user) : null;
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("unauthenticated", "Authentication is required.", 401);
  }
  return user;
}

export async function requireRole(...roles: ProfileType[]) {
  const user = await requireAuthenticatedUser();
  if (!roles.includes(user.role)) {
    throw new ApiError("forbidden", "You are not allowed to perform this action.", 403);
  }
  return user;
}

export async function requireDashboardAccess(dashboardType: DashboardType) {
  const user = await requireAuthenticatedUser();
  if (!canAccessDashboard(user.role, dashboardType)) {
    throw new ApiError("forbidden", "You are not allowed to access this dashboard.", 403);
  }
  return user;
}

export function assertProviderOwner(
  user: SafeUser,
  providerId: string,
) {
  if (user.role === "main_admin") {
    return;
  }

  if (!isProviderRole(user.role) || user.providerId !== providerId) {
    throw new ApiError("forbidden", "You cannot access another provider's records.", 403);
  }
}
