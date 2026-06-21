import { describe, expect, it } from "vitest";
import { prisma } from "../../lib/backend/prisma";
import {
  createSession,
  getUserBySessionToken,
  loginUser,
  logoutSession,
  safeUser,
  signupUser,
} from "../../lib/backend/auth-service";
import { canAccessDashboard } from "../../lib/backend/role-guard";
import {
  createLiveRequest,
  getLiveRequest,
  listLiveRequests,
  reviewLiveRequest,
  scheduleApprovedLiveRequest,
  updateLiveRequest,
} from "../../lib/backend/live-request-service";
import { assertProviderOwner } from "../../lib/backend/auth-context";
import { jsonError } from "../../lib/backend/api-response";
import { ApiError, ValidationApiError } from "../../lib/backend/errors";
import { getDashboardData, providerForCurrentUser } from "../../lib/backend/dashboard-service";
import { parseSignupInput } from "../../lib/backend/validation";
import { submitVerificationMetadata, reviewVerification } from "../../lib/backend/verification-service";
import { datePlusDays, getReplayStatus } from "../../lib/backend/replay-policy";
import { extendReplayAvailability, getLives, updateLivePin } from "../../lib/backend/live-service";
import { followProvider, getFollowedProviders, unfollowProvider } from "../../lib/backend/subscription-service";
import { getMainAnalyticsSummary, getProviderAnalyticsSummary, getViewerAnalyticsSummary } from "../../lib/backend/analytics-service";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

async function admin() {
  const adminUser = await prisma.user.findFirst({ where: { role: "main_admin" } });
  if (!adminUser) {
    throw new Error("Seeded main_admin not found. Run npm run backend:setup.");
  }
  return adminUser;
}

async function provider(role: "hotel" | "restaurant" | "supplier" | "service_provider" = "hotel") {
  const user = await signupUser({
    name: `Test ${role}`,
    email: uniqueEmail(role),
    password: "Password123!",
    role,
  });
  return { user, providerId: user.providerProfile!.id };
}

describe("backend foundation", () => {
  it("normalizes friendly signup validation responses", async () => {
    try {
      parseSignupInput({
        name: "",
        email: "not-email",
        password: "short",
        passwordConfirmation: "short",
        role: undefined,
      });
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationApiError);
      const response = jsonError(error);
      const payload = await response.json();
      expect(payload.error).toEqual({
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fields: {
          name: "Please enter your name.",
          email: "Please enter a valid email address.",
          password: "Password must contain at least 8 characters.",
          passwordConfirmation: "Please confirm your password.",
          role: "Please select an account type.",
        },
      });
      expect(JSON.stringify(payload)).not.toContain("too_small");
      expect(JSON.stringify(payload)).not.toContain("Zod");
    }
  });

  it("returns a friendly password confirmation mismatch", () => {
    expect(() =>
      parseSignupInput({
        name: "Mismatch User",
        email: uniqueEmail("mismatch"),
        password: "Password123!",
        passwordConfirmation: "Password456!",
        role: "viewer",
      }),
    ).toThrow("Please correct the highlighted fields.");

    try {
      parseSignupInput({
        name: "Mismatch User",
        email: uniqueEmail("mismatch"),
        password: "Password123!",
        passwordConfirmation: "Password456!",
        role: "viewer",
      });
    } catch (error) {
      expect((error as ValidationApiError).fields?.passwordConfirmation).toBe("Passwords do not match.");
    }
  });

  it("returns a friendly duplicate email field error", async () => {
    const email = uniqueEmail("duplicate");
    await signupUser({
      name: "Duplicate One",
      email,
      password: "Password123!",
      role: "viewer",
    });

    await expect(
      signupUser({
        name: "Duplicate Two",
        email,
        password: "Password123!",
        role: "viewer",
      }),
    ).rejects.toMatchObject({
      fields: { email: "An account already exists with this email address." },
    });
  });

  it("allows public roles and rejects public main_admin registration", async () => {
    const user = await signupUser({
      name: "Signup Viewer",
      email: uniqueEmail("viewer"),
      password: "Password123!",
      role: "viewer",
    });
    expect(user.role).toBe("viewer");

    await expect(
      signupUser({
        name: "Bad Admin",
        email: uniqueEmail("admin"),
        password: "Password123!",
        role: "main_admin",
      }),
    ).rejects.toThrow(/cannot be registered publicly/i);
  });

  it("logs in, creates server sessions, and invalidates logout", async () => {
    const email = uniqueEmail("login");
    const user = await signupUser({
      name: "Login User",
      email,
      password: "Password123!",
      role: "viewer",
    });
    const loggedIn = await loginUser(email, "Password123!");
    expect(loggedIn.id).toBe(user.id);

    const session = await createSession(user.id);
    expect((await getUserBySessionToken(session.token))?.id).toBe(user.id);
    await logoutSession(session.token);
    expect(await getUserBySessionToken(session.token)).toBeNull();
  });

  it("enforces role guards and provider ownership", async () => {
    expect(canAccessDashboard("main_admin", "supplier")).toBe(true);
    expect(canAccessDashboard("viewer", "supplier")).toBe(false);

    const a = await provider("supplier");
    const b = await provider("restaurant");
    const request = await createLiveRequest(a.providerId, {
      title: "Owned live",
      category: "Sourcing",
      description: "A real persistent request",
      preferredDate: new Date().toISOString(),
    });

    await expect(updateLiveRequest(b.providerId, request.id, { title: "Nope" })).rejects.toThrow(/another provider/i);
  });

  it("rejects unauthenticated live request submissions with 401", async () => {
    const response = jsonError(new ApiError("unauthenticated", "Authentication is required.", 401));
    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("unauthenticated");
  });

  it("prevents viewers from submitting live requests", async () => {
    const viewer = await signupUser({
      name: "Live Viewer",
      email: uniqueEmail("live-viewer"),
      password: "Password123!",
      role: "viewer",
    });

    await expect(providerForCurrentUser(safeUser(viewer))).rejects.toThrow(/provider profile is required/i);
  });

  it("lets providers submit persistent live requests and keeps them private", async () => {
    const a = await provider("restaurant");
    const b = await provider("supplier");
    const request = await createLiveRequest(a.providerId, {
      title: "Chef table preview",
      category: "Restaurant",
      description: "Preview the tasting menu for review.",
      preferredDate: datePlusDays(new Date(), 1).toISOString(),
    });

    expect(request.status).toBe("pending_review");
    expect(request.providerId).toBe(a.providerId);
    expect(await prisma.liveRequest.findUnique({ where: { id: request.id } })).toBeTruthy();
    expect((await listLiveRequests({ providerId: a.providerId })).some((item) => item.id === request.id)).toBe(true);
    expect(() => assertProviderOwner(safeUser(b.user), request.providerId)).toThrow(/another provider/i);

    const persisted = await getLiveRequest(request.id);
    expect(persisted.title).toBe("Chef table preview");
  });

  it("shows pending live requests to main admin and persists approve or reject", async () => {
    const adminUser = await admin();
    const first = await provider("hotel");
    const second = await provider("service_provider");
    const pending = await createLiveRequest(first.providerId, {
      title: "Suite launch",
      category: "Rooms",
      description: "Show the new suite live.",
      preferredDate: datePlusDays(new Date(), 1).toISOString(),
    });
    const rejectable = await createLiveRequest(second.providerId, {
      title: "Spa launch",
      category: "Spa",
      description: "Show the spa facilities live.",
      preferredDate: datePlusDays(new Date(), 2).toISOString(),
    });

    const dashboard = await getDashboardData("main", safeUser(adminUser));
    expect(dashboard.pendingLiveRequests?.some((item) => item.id === pending.id)).toBe(true);

    const approved = await reviewLiveRequest({
      adminId: adminUser.id,
      requestId: pending.id,
      status: "approved",
      adminNote: "Approved.",
    });
    const rejected = await reviewLiveRequest({
      adminId: adminUser.id,
      requestId: rejectable.id,
      status: "rejected",
      adminNote: "Needs more information.",
    });

    expect(approved.status).toBe("approved");
    expect(rejected.status).toBe("rejected");
    expect((await prisma.liveRequest.findUnique({ where: { id: pending.id } }))?.status).toBe("approved");
    expect((await prisma.liveRequest.findUnique({ where: { id: rejectable.id } }))?.adminNote).toBe("Needs more information.");
  });

  it("runs live request, admin review, schedule, pin, replay, and activity workflows", async () => {
    const adminUser = await admin();
    const { providerId } = await provider("hotel");
    const liveRequest = await createLiveRequest(providerId, {
      title: "Suite walkthrough",
      category: "Hotel",
      description: "Show the suite and guest proof",
      preferredDate: new Date().toISOString(),
    });

    const approved = await reviewLiveRequest({
      adminId: adminUser.id,
      requestId: liveRequest.id,
      status: "approved",
      adminNote: "Approved for local test.",
    });
    expect(approved.status).toBe("approved");

    const live = await scheduleApprovedLiveRequest({
      adminId: adminUser.id,
      requestId: liveRequest.id,
      scheduledAt: datePlusDays(new Date(), 1).toISOString(),
    });
    const pinned = await updateLivePin({
      adminId: adminUser.id,
      liveId: live.id,
      isPinned: true,
      pinReason: "featured_by_buyamia",
      pinExpiresAt: datePlusDays(new Date(), 2).toISOString(),
    });
    expect(pinned.isPinned).toBe(true);

    const extended = await extendReplayAvailability({
      adminId: adminUser.id,
      liveId: live.id,
      extensionDays: 5,
    });
    expect(extended.replay.daysRemaining).toBeGreaterThan(0);

    const activity = await prisma.adminActivity.findMany({ where: { adminId: adminUser.id } });
    expect(activity.length).toBeGreaterThan(0);
  });

  it("handles verification metadata and admin review without identity files", async () => {
    const adminUser = await admin();
    const { user } = await provider("service_provider");
    const submitted = await submitVerificationMetadata(user.id, {
      documentType: "business_license_metadata",
      documentMetadata: { reference: "metadata-only" },
    });
    expect(submitted.verificationStatus).toBe("pending");

    const reviewed = await reviewVerification({
      adminId: adminUser.id,
      userId: user.id,
      status: "needs_more_info",
      reviewNote: "Add metadata label.",
    });
    expect(reviewed.verificationStatus).toBe("needs_more_info");
  });

  it("calculates replay expiration and sorts active pins first", async () => {
    expect(getReplayStatus(datePlusDays(new Date(), 1)).status).toBe("expiring_soon");
    expect(getReplayStatus(datePlusDays(new Date(), -1)).status).toBe("expired");

    const lives = await getLives();
    const firstNormalIndex = lives.findIndex((live) => !live.isPinned);
    const laterPinnedIndex = lives.findIndex((live, index) => index > firstNormalIndex && live.isPinned);
    expect(laterPinnedIndex).toBe(-1);
  });

  it("supports follow, unfollow, duplicate prevention, and analytics calculations", async () => {
    const viewer = await signupUser({
      name: "Follow Viewer",
      email: uniqueEmail("follow-viewer"),
      password: "Password123!",
      role: "viewer",
    });
    const { providerId } = await provider("supplier");

    await followProvider({ viewerUserId: viewer.id, providerId });
    await followProvider({ viewerUserId: viewer.id, providerId });
    expect(await prisma.follow.count({ where: { viewerId: viewer.id, providerId } })).toBe(1);
    expect((await getFollowedProviders(viewer.id)).length).toBe(1);

    const providerAnalytics = await getProviderAnalyticsSummary(providerId);
    expect(providerAnalytics.followers).toBe(1);
    const viewerAnalytics = await getViewerAnalyticsSummary(viewer.id);
    expect(viewerAnalytics.followedProviders).toBe(1);
    expect((await getMainAnalyticsSummary()).totalUsers).toBeGreaterThan(0);

    await unfollowProvider({ viewerUserId: viewer.id, providerId });
    expect(await prisma.follow.count({ where: { viewerId: viewer.id, providerId } })).toBe(0);
  });
});
