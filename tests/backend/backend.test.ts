import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
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
import { extendReplayAvailability, getLiveDetailsById, getLives, listLives, updateLivePin } from "../../lib/backend/live-service";
import { followProvider, getFollowedProviders, unfollowProvider } from "../../lib/backend/subscription-service";
import { getMainAnalyticsSummary, getProviderAnalyticsSummary, getViewerAnalyticsSummary } from "../../lib/backend/analytics-service";
import {
  createNegotiation,
  createRfq,
  listCalendarEvents,
  listNegotiations,
  listRfqs,
  listRiskItems,
  rankSuppliers,
  recordRiskDecision,
  updateNegotiation,
} from "../../lib/backend/procurement-service";
import { getAssistantIntegrationStatus, runAssistantQuery } from "../../lib/backend/assistant-service";

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

  it("paginates, filters, mutates, counts active pins, and loads admin live details", async () => {
    const adminUser = await admin();
    const prefix = `Admin live controls ${Date.now()}`;
    const hotel = await provider("hotel");
    const restaurant = await provider("restaurant");
    const supplier = await provider("supplier");
    const service = await provider("service_provider");
    const providers = [hotel, restaurant, supplier, service];
    const categories = ["Rooms", "Hotel", "Restaurant", "Food & Brunch", "Spa", "Facilities", "Services", "Experiences", "Other"];
    const created = [];

    for (let index = 0; index < 13; index += 1) {
      const owner = providers[index % providers.length];
      const live = await prisma.live.create({
        data: {
          providerId: owner.providerId,
          title: `${prefix} ${index}`,
          category: categories[index % categories.length],
          status: index % 3 === 0 ? "scheduled" : index % 3 === 1 ? "active" : "completed",
          scheduledAt: datePlusDays(new Date(), index - 3),
          startedAt: index % 3 === 0 ? null : datePlusDays(new Date(), index - 3),
          endedAt: index % 3 === 2 ? datePlusDays(new Date(), index - 2) : null,
          replayExpiresAt: index === 2 ? datePlusDays(new Date(), -1) : index === 5 ? datePlusDays(new Date(), 1) : datePlusDays(new Date(), 7),
          isPinned: index === 0 || index === 1 || index === 2,
          pinReason: index === 0 ? "sponsored" : index === 1 ? "nearby" : index === 2 ? "most_watched" : undefined,
          pinExpiresAt: index === 2 ? datePlusDays(new Date(), -1) : index < 2 ? datePlusDays(new Date(), 4) : undefined,
          priorityScore: 100 - index,
        },
      });
      created.push(live);
    }

    await prisma.analyticsEvent.createMany({
      data: [
        { liveId: created[0].id, providerId: created[0].providerId, eventType: "live_viewed" },
        { liveId: created[0].id, providerId: created[0].providerId, eventType: "replay_viewed" },
        { liveId: created[0].id, providerId: created[0].providerId, eventType: "conversion_intent" },
      ],
    });

    const firstPage = await listLives({ search: prefix });
    expect(firstPage.items).toHaveLength(10);
    expect(firstPage.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      totalItems: 13,
      totalPages: 2,
      hasPreviousPage: false,
      hasNextPage: true,
    });

    const nextPage = await listLives({ search: prefix, page: 2 });
    expect(nextPage.items).toHaveLength(3);
    expect(nextPage.pagination.hasPreviousPage).toBe(true);
    expect(nextPage.pagination.hasNextPage).toBe(false);

    const previousPage = await listLives({ search: prefix, page: 1 });
    expect(previousPage.pagination.hasPreviousPage).toBe(false);

    const lastPage = await listLives({ search: prefix, page: 2 });
    expect(lastPage.pagination.page).toBe(2);
    expect(lastPage.pagination.hasNextPage).toBe(false);

    expect((await listLives({ search: `${prefix} 11` })).items.every((live) => live.title.includes("11"))).toBe(true);
    expect((await listLives({ search: prefix, status: "scheduled" })).items.every((live) => live.status === "scheduled")).toBe(true);
    expect((await listLives({ search: prefix, status: "active" })).items.every((live) => live.status === "live")).toBe(true);
    expect((await listLives({ search: prefix, status: "replay" })).items.every((live) => live.status === "replay" && live.replay.status !== "expired")).toBe(true);
    expect((await listLives({ search: prefix, status: "expired" })).items.every((live) => live.replay.status === "expired")).toBe(true);
    expect((await listLives({ search: prefix, category: "Rooms" })).items.every((live) => live.category === "Rooms")).toBe(true);
    expect((await listLives({ search: prefix, providerRole: "hotel" })).items.every((live) => live.providerRole === "hotel")).toBe(true);
    expect((await listLives({ search: prefix, providerId: supplier.providerId })).items.every((live) => live.providerId === supplier.providerId)).toBe(true);
    expect((await listLives({ search: prefix, pinned: "pinned" })).items.every((live) => live.isPinned)).toBe(true);
    expect((await listLives({ search: prefix, pinned: "not_pinned" })).items.every((live) => !live.isPinned)).toBe(true);
    expect((await listLives({ search: prefix, pinReason: "sponsored" })).items.every((live) => live.pinReason === "sponsored")).toBe(true);
    expect((await listLives({ search: prefix, replayStatus: "active" })).items.every((live) => live.replay.status === "active")).toBe(true);
    expect((await listLives({ search: prefix, replayStatus: "expiring_soon" })).items.every((live) => live.replay.status === "expiring_soon")).toBe(true);
    expect((await listLives({ search: prefix, replayStatus: "expired" })).items.every((live) => live.replay.status === "expired")).toBe(true);
    expect((await listLives({ search: prefix, category: "Rooms", providerRole: "hotel", pinned: "pinned", pinReason: "sponsored" })).items).toHaveLength(1);

    const capped = await listLives({ search: prefix, pageSize: 500 });
    expect(capped.pagination.pageSize).toBe(50);
    expect(capped.items.length).toBe(13);

    const activePinCount = await prisma.live.count({
      where: {
        isPinned: true,
        OR: [{ pinExpiresAt: null }, { pinExpiresAt: { gt: new Date() } }],
      },
    });
    expect(firstPage.activePinnedCount).toBe(activePinCount);

    const unpinned = await updateLivePin({ adminId: adminUser.id, liveId: created[0].id, isPinned: false });
    expect(unpinned.isPinned).toBe(false);
    const pinned = await updateLivePin({ adminId: adminUser.id, liveId: created[3].id, isPinned: true, pinReason: "featured_by_buyamia" });
    expect(pinned.isPinned).toBe(true);
    expect(pinned.pinReason).toBe("featured_by_buyamia");

    const beforeExtension = (await prisma.live.findUniqueOrThrow({ where: { id: created[4].id } })).replayExpiresAt!;
    await extendReplayAvailability({ adminId: adminUser.id, liveId: created[4].id, extensionDays: 5 });
    const afterExtension = (await prisma.live.findUniqueOrThrow({ where: { id: created[4].id } })).replayExpiresAt!;
    expect(afterExtension.getTime()).toBeGreaterThan(beforeExtension.getTime());

    const details = await getLiveDetailsById(created[0].id);
    expect(details.id).toBe(created[0].id);
    expect(details.providerName).toBeTruthy();
    expect(details.viewerCount).toBe(1);
    expect(details.replayViews).toBe(1);
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

  it("creates and lists persistent RFQs", async () => {
    const adminUser = await admin();
    const rfq = await createRfq(adminUser.id, {
      title: "Outdoor furniture package",
      category: "Furniture",
      requirements: "Need weatherproof lounge sets with warranty, MOQ, CIF Bali, and production lead time.",
      budgetMin: 1000,
      budgetMax: 5000,
      deadline: datePlusDays(new Date(), 7).toISOString(),
      supplierType: "supplier",
    });

    expect(rfq.id).toBeTruthy();
    expect((await prisma.rfq.findUnique({ where: { id: rfq.id } }))?.title).toBe("Outdoor furniture package");
    expect((await listRfqs()).some((item) => item.id === rfq.id)).toBe(true);
  });

  it("ranks suppliers with stored filters and metrics", async () => {
    const { providerId } = await provider("supplier");
    await prisma.providerProfile.update({ where: { id: providerId }, data: { location: "Ubud" } });
    const ranked = await rankSuppliers({ search: "Test supplier", category: "supplier", location: "Ubud", sort: "lives" });

    expect(ranked.some((item) => item.id === providerId)).toBe(true);
    expect(ranked.every((item) => item.category === "supplier")).toBe(true);
  });

  it("creates negotiations, stores messages, and updates status", async () => {
    const adminUser = await admin();
    const { providerId } = await provider("supplier");
    const rfq = await createRfq(adminUser.id, {
      title: "Negotiation RFQ",
      category: "Fixtures",
      requirements: "Need fixtures with compliance notes, delivery dates, warranty, and packaging terms.",
      deadline: datePlusDays(new Date(), 5).toISOString(),
      supplierType: "supplier",
    });

    const negotiation = await createNegotiation(adminUser.id, {
      title: "Fixture terms",
      providerId,
      rfqId: rfq.id,
      message: "Please confirm lead time.",
    });
    const updated = await updateNegotiation(adminUser.id, negotiation.id, {
      status: "awaiting_response",
      message: "Awaiting supplier confirmation.",
    });

    expect(updated.status).toBe("awaiting_response");
    expect(updated.messages.length).toBe(2);
    expect((await listNegotiations()).some((item) => item.id === negotiation.id)).toBe(true);
  });

  it("derives risk items and persists admin review decisions", async () => {
    const adminUser = await admin();
    const { providerId } = await provider("service_provider");
    await prisma.user.update({ where: { id: (await prisma.providerProfile.findUniqueOrThrow({ where: { id: providerId } })).userId }, data: { verificationStatus: "rejected" } });
    const items = await listRiskItems({ role: "service_provider", riskLevel: "high" });
    const item = items.find((candidate) => candidate.providerId === providerId);

    expect(item?.indicators.join(" ")).toMatch(/Verification is rejected/);
    const review = await recordRiskDecision(adminUser.id, {
      targetType: "provider",
      providerId,
      riskLevel: "high",
      indicators: item?.indicators ?? [],
      reviewStatus: "escalated",
      adminNote: "Escalate verification rejection.",
    });
    expect(review.reviewStatus).toBe("escalated");
    expect((await prisma.riskReview.findUnique({ where: { id: review.id } }))?.adminNote).toContain("Escalate");
  });

  it("builds calendar events from stored operational dates", async () => {
    const { providerId } = await provider("hotel");
    const request = await createLiveRequest(providerId, {
      title: "Calendar live request",
      category: "Rooms",
      description: "Preferred date should appear on the operations calendar.",
      preferredDate: datePlusDays(new Date(), 3).toISOString(),
    });

    const events = await listCalendarEvents({ role: "hotel" });
    expect(events.some((event) => event.id === `request:${request.id}`)).toBe(true);
    expect(events.every((event) => event.detailHref.startsWith("/") && event.detailHref !== "/live")).toBe(true);
  });

  it("runs the local Buyamia Assistant command registry and search with role permissions", async () => {
    const adminUser = safeUser(await admin());
    const viewer = safeUser(await signupUser({
      name: "Assistant Viewer",
      email: uniqueEmail("assistant-viewer"),
      password: "Password123!",
      role: "viewer",
    }));
    const coreCommands = [
      ["Open calendar", "/dashboard/main/calendar"],
      ["Generate an RFQ", "/dashboard/main/rfqs/new"],
      ["Show RFQs", "/dashboard/main/rfqs"],
      ["Rank suppliers", "/dashboard/main/suppliers/rank"],
      ["Open negotiations", "/dashboard/main/negotiations"],
      ["Review risk", "/dashboard/main/risk"],
      ["Show pending live requests", "/dashboard/main#pending-live-requests"],
      ["Manage lives", "/dashboard/main/lives"],
      ["Show pinned lives", "/dashboard/main/lives?pinned=true"],
      ["Show replay expiring soon", "/dashboard/main/lives?replayStatus=expiring_soon"],
      ["Open hotel dashboard", "/dashboard/hotel"],
      ["Open restaurant dashboard", "/dashboard/restaurant"],
      ["Open supplier dashboard", "/dashboard/supplier"],
      ["Open services dashboard", "/dashboard/services"],
      ["Open viewer dashboard", "/dashboard/viewer"],
      ["Explore live streams", "/live"],
      ["Create account", "/signup"],
    ] as const;

    for (const [query, href] of coreCommands) {
      const result = await runAssistantQuery({ query }, adminUser);
      expect(result.recognizedAction?.href, query).toBe(href);
    }

    const help = await runAssistantQuery({ query: "Help" }, adminUser);
    expect(help.actions.length).toBeGreaterThan(5);
    expect(help.message).toMatch(/Available commands/);

    const restricted = await runAssistantQuery({ query: "Manage lives" }, viewer);
    expect(restricted.recognizedAction).toBeUndefined();
    expect(restricted.actions.some((action) => action.href.includes("/dashboard/main"))).toBe(false);

    const localStatus = getAssistantIntegrationStatus();
    expect(localStatus.mode).toBe(process.env.BUYAMIA_AI_PROVIDER || process.env.OPENAI_API_KEY ? "provider" : "local");
    expect(localStatus).not.toHaveProperty("apiKey");

    const publicCommand = await runAssistantQuery({ query: "Explore live streams" }, null);
    expect(publicCommand.recognizedAction?.href).toBe("/live");

    const liveSearch = await runAssistantQuery({ query: "Find hotel lives" }, adminUser);
    expect(liveSearch.results.some((result) => result.type === "live")).toBe(true);

    const providerSearch = await runAssistantQuery({ query: "Find supplier Bali Rattan" }, adminUser);
    expect(providerSearch.results.some((result) => result.type === "provider" && /rattan/i.test(result.title))).toBe(true);

    const rfq = await createRfq(adminUser.id, {
      title: "Assistant RFQ patio set",
      category: "Furniture",
      requirements: "Find outdoor patio sets with warranty, lead time, and CIF Bali pricing.",
      deadline: datePlusDays(new Date(), 5).toISOString(),
      supplierType: "supplier",
    });
    const rfqSearch = await runAssistantQuery({ query: "Assistant RFQ patio set" }, adminUser);
    expect(rfqSearch.results.some((result) => result.href === `/dashboard/main/rfqs/${rfq.id}`)).toBe(true);

    const unknown = await runAssistantQuery({ query: "quantum pineapple schedule" }, adminUser);
    expect(unknown.recognizedAction).toBeUndefined();
    expect(unknown.message).toMatch(/could not match/i);
    expect(unknown.suggestions.length).toBeGreaterThan(0);
  });

  it("keeps procurement quick actions away from generic live routing", () => {
    const source = readFileSync("app/dashboard-platform.tsx", "utf8");
    for (const label of ["Generate RFQ", "Rank suppliers", "Open negotiation", "Review risk", "View calendar"]) {
      expect(source).toContain(`"${label.toLowerCase()}": "/dashboard/main/`);
    }
  });

  it("protects new main-admin action APIs with role authorization", () => {
    for (const file of [
      "app/api/rfqs/route.ts",
      "app/api/rfqs/[id]/route.ts",
      "app/api/suppliers/rank/route.ts",
      "app/api/suppliers/[id]/route.ts",
      "app/api/negotiations/route.ts",
      "app/api/negotiations/[id]/route.ts",
      "app/api/risk-reviews/route.ts",
      "app/api/calendar-events/route.ts",
      "app/api/lives/route.ts",
    ]) {
      expect(readFileSync(file, "utf8")).toContain('requireRole("main_admin")');
    }
    expect(readFileSync("app/dashboard/main/lives/page.tsx", "utf8")).toContain('requireRole("main_admin")');
    expect(readFileSync("app/dashboard/main/lives/[id]/page.tsx", "utf8")).toContain('requireRole("main_admin")');
  });
});
