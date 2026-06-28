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
import {
  createScheduledStream,
  extendReplayAvailability,
  getFeaturedSupplierSessions,
  getLiveDetailsById,
  getLives,
  listProviderReplays,
  listLives,
  updateProviderReplayAvailability,
  updateLivePin,
} from "../../lib/backend/live-service";
import { followProvider, getAvailableProvidersForViewer, getFollowedProviders, unfollowProvider } from "../../lib/backend/subscription-service";
import { getMainAnalyticsSummary, getProviderAnalyticsSummary, getViewerAnalyticsSummary } from "../../lib/backend/analytics-service";
import { buildReferralLink, getProcurementAgentDashboardData } from "../../lib/backend/procurement-agent-service";
import {
  createNegotiation,
  createRfq,
  getSupplierDetail,
  listCalendarEvents,
  listNegotiations,
  listRfqs,
  listRiskItems,
  rankSuppliers,
  recordRiskDecision,
  updateNegotiation,
} from "../../lib/backend/procurement-service";
import {
  createSellerApplication,
  listSellerApplications,
  updateSellerApplicationStatus,
} from "../../lib/backend/seller-application-service";
import { getAssistantIntegrationStatus, runAssistantQuery } from "../../lib/backend/assistant-service";
import { createAiSourcingRequest } from "../../lib/backend/ai-sourcing-service";
import { createBookingPush, listBookingPushes } from "../../lib/backend/booking-push-service";
import { generateReviewBrief, listReviewBriefs } from "../../lib/backend/review-brief-service";
import { createTasting, listTastings } from "../../lib/backend/tasting-service";
import { createReservation, listReservations, updateReservation } from "../../lib/backend/reservation-service";
import {
  createMenuHighlight,
  deleteMenuHighlight,
  listMenuHighlights,
  updateMenuHighlight,
} from "../../lib/backend/menu-highlight-service";
import {
  createPinnedPlacementRequest,
  getPinnedPlacementOptions,
  listPinnedPlacementRequests,
} from "../../lib/backend/pinned-placement-service";

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

  it("lets providers schedule persistent streams directly", async () => {
    const { providerId } = await provider("hotel");
    const scheduledAt = datePlusDays(new Date(), 2).toISOString();
    const live = await createScheduledStream(providerId, {
      title: "Direct suite stream",
      category: "Hotel",
      description: "A scheduled live room created without admin review.",
      scheduledAt,
      providerType: "hotel",
      estimatedDurationMinutes: 45,
      language: "English",
      thumbnailUrl: "https://example.test/suite.jpg",
      visibility: "private",
    });

    expect(live.status).toBe("scheduled");
    expect(live.providerId).toBe(providerId);
    expect(live.startsAt).toBe(scheduledAt);

    const persisted = await prisma.live.findUnique({ where: { id: live.id } });
    expect(persisted?.status).toBe("scheduled");
    expect(persisted?.scheduledAt?.toISOString()).toBe(scheduledAt);
    expect(persisted?.replayExpiresAt).toBeTruthy();
    expect((persisted?.commerceData as { schedule?: { estimatedDurationMinutes?: number; visibility?: string } } | null)?.schedule).toMatchObject({
      estimatedDurationMinutes: 45,
      visibility: "private",
    });

    await expect(
      createScheduledStream(providerId, {
        title: "Direct suite stream",
        category: "Hotel",
        scheduledAt,
      }),
    ).rejects.toMatchObject({
      fields: { scheduledAt: "A stream with this title is already scheduled at this time." },
    });

    await expect(
      createScheduledStream(providerId, {
        title: "Wrong provider type",
        category: "Hotel",
        scheduledAt: datePlusDays(new Date(), 3).toISOString(),
        providerType: "supplier",
      }),
    ).rejects.toMatchObject({
      fields: { providerType: "Please select the provider type for your account." },
    });

    await expect(
      createScheduledStream(providerId, {
        title: "Past stream",
        category: "Hotel",
        scheduledAt: datePlusDays(new Date(), -1).toISOString(),
      }),
    ).rejects.toMatchObject({
      fields: { scheduledAt: "The scheduled date and time must be in the future." },
    });
  });

  it("lets hotel providers create persistent booking pushes", async () => {
    const hotel = await provider("hotel");
    const supplier = await provider("supplier");
    const startDate = datePlusDays(new Date(), 3).toISOString();
    const endDate = datePlusDays(new Date(), 10).toISOString();
    const bookingPush = await createBookingPush(hotel.providerId, {
      campaignTitle: "Suite replay weekend",
      hotelName: "Sanur Wellness Hotel",
      promotionDescription: "Promote replay viewers into weekend suite bookings.",
      roomType: "Ocean suite",
      bookingOffer: "Stay three nights and receive airport transfer.",
      discountPercentage: 12,
      startDate,
      endDate,
      availableRooms: 8,
      targetAudience: "Singapore families",
      featuredImageUrl: "https://example.test/suite.jpg",
      callToActionText: "Book the suite",
      status: "scheduled",
    });

    expect(bookingPush.status).toBe("scheduled");
    expect(bookingPush.providerId).toBe(hotel.providerId);
    expect(await prisma.bookingPush.findUnique({ where: { id: bookingPush.id } })).toBeTruthy();
    expect((await listBookingPushes(hotel.providerId)).some((item) => item.id === bookingPush.id)).toBe(true);

    await expect(
      createBookingPush(supplier.providerId, {
        campaignTitle: "Bad supplier campaign",
        hotelName: "Not a hotel",
        promotionDescription: "Supplier cannot create hotel booking pushes.",
        roomType: "Suite",
        bookingOffer: "Offer",
        startDate,
        endDate,
        availableRooms: 1,
        targetAudience: "Guests",
        callToActionText: "Book",
      }),
    ).rejects.toThrow(/Only hotel providers/);

    await expect(
      createBookingPush(hotel.providerId, {
        campaignTitle: "Bad dates",
        hotelName: "Sanur Wellness Hotel",
        promotionDescription: "Invalid date order should fail.",
        roomType: "Suite",
        bookingOffer: "Offer",
        startDate: endDate,
        endDate: startDate,
        availableRooms: 1,
        targetAudience: "Guests",
        callToActionText: "Book",
      }),
    ).rejects.toMatchObject({
      fields: { endDate: "End date must be after start date." },
    });
  });

  it("lets hotel providers generate persistent mock review briefs", async () => {
    const hotel = await provider("hotel");
    const supplier = await provider("supplier");
    const brief = await generateReviewBrief(safeUser(hotel.user), {
      reviewPeriod: "last_30_days",
      reviewSource: "all",
      language: "English",
    });

    expect(brief.id).toBeTruthy();
    expect(brief.providerId).toBe(hotel.providerId);
    expect(brief.report.overallSentimentScore).toBeGreaterThan(0);
    expect(brief.report.mostMentionedTopics.length).toBeGreaterThan(0);
    expect(await prisma.reviewBrief.findUnique({ where: { id: brief.id } })).toBeTruthy();
    expect((await listReviewBriefs(hotel.providerId)).some((item) => item.id === brief.id)).toBe(true);

    await expect(
      generateReviewBrief(safeUser(supplier.user), {
        reviewPeriod: "last_30_days",
        reviewSource: "all",
        language: "English",
      }),
    ).rejects.toThrow(/Only hotel providers/);

    await expect(
      generateReviewBrief(safeUser(hotel.user), {
        reviewPeriod: "not_a_period",
        reviewSource: "all",
        language: "English",
      }),
    ).rejects.toMatchObject({
      fields: { reviewPeriod: "Please select a valid review period." },
    });
  });

  it("lets restaurant providers create persistent tastings", async () => {
    const restaurant = await provider("restaurant");
    const hotel = await provider("hotel");
    const tastingDate = datePlusDays(new Date(), 8);
    const tasting = await createTasting(restaurant.providerId, {
      title: "Coastal chef tasting",
      restaurantName: "Seminyak Supper Club",
      description: "A chef-led tasting menu for live viewers and in-person diners.",
      cuisineCategory: "Seafood",
      tastingType: "hybrid",
      date: tastingDate.toISOString().slice(0, 10),
      time: "19:00",
      durationMinutes: 120,
      maxParticipants: 24,
      price: 45,
      location: "Seminyak dining room and live room",
      featuredImageUrl: "https://example.test/tasting.jpg",
      additionalNotes: "Include shellfish allergy note.",
      status: "published",
    });

    expect(tasting.status).toBe("published");
    expect(tasting.providerId).toBe(restaurant.providerId);
    expect(tasting.maxParticipants).toBe(24);
    expect(await prisma.tasting.findUnique({ where: { id: tasting.id } })).toBeTruthy();
    expect((await listTastings(restaurant.providerId)).some((item) => item.id === tasting.id)).toBe(true);

    await expect(
      createTasting(hotel.providerId, {
        title: "Wrong provider",
        restaurantName: "Hotel restaurant",
        description: "Hotels should not create restaurant tasting records here.",
        cuisineCategory: "Balinese",
        tastingType: "in_person",
        date: tastingDate.toISOString().slice(0, 10),
        time: "19:00",
        durationMinutes: 90,
        maxParticipants: 10,
        location: "Dining room",
      }),
    ).rejects.toThrow(/Only restaurant providers/);

    await expect(
      createTasting(restaurant.providerId, {
        title: "Past tasting",
        restaurantName: "Seminyak Supper Club",
        description: "Past dates should fail validation.",
        cuisineCategory: "Balinese",
        tastingType: "in_person",
        date: datePlusDays(new Date(), -1).toISOString().slice(0, 10),
        time: "19:00",
        durationMinutes: 90,
        maxParticipants: 12,
        location: "Dining room",
      }),
    ).rejects.toMatchObject({
      fields: { date: "Tasting date and time must be in the future." },
    });

    await expect(
      createTasting(restaurant.providerId, {
        title: "Bad status",
        restaurantName: "Seminyak Supper Club",
        description: "Invalid status should fail validation.",
        cuisineCategory: "Balinese",
        tastingType: "in_person",
        date: tastingDate.toISOString().slice(0, 10),
        time: "19:00",
        durationMinutes: 90,
        maxParticipants: 12,
        location: "Dining room",
        status: "paused",
      }),
    ).rejects.toMatchObject({
      fields: { status: expect.any(String) },
    });
  });

  it("lets restaurant providers manage reservation updates", async () => {
    const restaurant = await provider("restaurant");
    const hotel = await provider("hotel");
    const firstDate = datePlusDays(new Date(), 4);
    const secondDate = datePlusDays(new Date(), 6);
    const reservation = await createReservation(restaurant.providerId, {
      customerName: "Maya Diner",
      date: firstDate.toISOString().slice(0, 10),
      time: "20:00",
      partySize: 4,
      status: "pending",
      bookingReference: `RSV-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      notes: "Window table requested.",
    });

    expect(reservation.status).toBe("pending");
    expect(reservation.providerId).toBe(restaurant.providerId);
    expect(await prisma.reservation.findUnique({ where: { id: reservation.id } })).toBeTruthy();
    expect((await listReservations(restaurant.providerId, { customerName: "Maya", scope: "upcoming" })).some((item) => item.id === reservation.id)).toBe(true);

    const confirmed = await updateReservation(restaurant.providerId, reservation.id, { status: "confirmed" });
    expect(confirmed.status).toBe("confirmed");

    const rescheduled = await updateReservation(restaurant.providerId, reservation.id, {
      date: secondDate.toISOString().slice(0, 10),
      time: "21:00",
      partySize: 6,
      notes: "Moved to chef counter.",
    });
    expect(rescheduled.status).toBe("rescheduled");
    expect(rescheduled.partySize).toBe(6);

    await expect(
      createReservation(hotel.providerId, {
        customerName: "Wrong provider",
        date: firstDate.toISOString().slice(0, 10),
        time: "20:00",
        partySize: 2,
        bookingReference: `HOTEL-RSV-${Date.now()}`,
      }),
    ).rejects.toThrow(/Only restaurant providers/);

    await expect(updateReservation(restaurant.providerId, reservation.id, { status: "paused" })).rejects.toMatchObject({
      fields: { status: expect.any(String) },
    });

    await expect(updateReservation(restaurant.providerId, reservation.id, { partySize: 0 })).rejects.toMatchObject({
      fields: { partySize: "Please enter a valid party size." },
    });
  });

  it("lets restaurant providers manage menu highlights", async () => {
    const restaurant = await provider("restaurant");
    const hotel = await provider("hotel");
    const startDate = datePlusDays(new Date(), 2).toISOString().slice(0, 10);
    const endDate = datePlusDays(new Date(), 12).toISOString().slice(0, 10);
    const highlight = await createMenuHighlight(restaurant.providerId, {
      dishName: "Coconut reef tasting plate",
      category: "Seafood",
      shortDescription: "Live-ready seasonal seafood plate with coconut sambal.",
      price: 38,
      availabilityStatus: "available",
      featuredImageUrl: "https://example.test/menu.jpg",
      featuredBadge: "Chef pick",
      priorityLevel: 8,
      startDate,
      endDate,
      visibilityStatus: "public",
      isPinned: true,
      status: "active",
    });

    expect(highlight.status).toBe("active");
    expect(highlight.isPinned).toBe(true);
    expect(highlight.providerId).toBe(restaurant.providerId);
    expect(await prisma.menuHighlight.findUnique({ where: { id: highlight.id } })).toBeTruthy();
    expect((await listMenuHighlights(restaurant.providerId, { search: "Coconut", featured: "featured" })).some((item) => item.id === highlight.id)).toBe(true);

    const unpinned = await updateMenuHighlight(restaurant.providerId, highlight.id, { isPinned: false, priorityLevel: 4 });
    expect(unpinned.isPinned).toBe(false);
    expect(unpinned.priorityLevel).toBe(4);

    const archived = await updateMenuHighlight(restaurant.providerId, highlight.id, { status: "archived" });
    expect(archived.status).toBe("archived");

    await expect(
      createMenuHighlight(hotel.providerId, {
        dishName: "Wrong provider dish",
        category: "Dinner",
        shortDescription: "Hotels should not manage restaurant menu highlights.",
        price: 20,
        availabilityStatus: "available",
        priorityLevel: 5,
        startDate,
        endDate,
        visibilityStatus: "public",
      }),
    ).rejects.toThrow(/Only restaurant providers/);

    await expect(
      createMenuHighlight(restaurant.providerId, {
        dishName: "Bad priority",
        category: "Dinner",
        shortDescription: "Invalid priority should fail validation.",
        price: 20,
        availabilityStatus: "available",
        priorityLevel: 99,
        startDate,
        endDate,
        visibilityStatus: "public",
      }),
    ).rejects.toMatchObject({
      fields: { priorityLevel: "Priority must be between 1 and 10." },
    });

    const deleted = await deleteMenuHighlight(restaurant.providerId, highlight.id);
    expect(deleted.deleted).toBe(true);
    expect(await prisma.menuHighlight.findUnique({ where: { id: highlight.id } })).toBeFalsy();
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

  it("persists seller applications with document metadata and admin-ready statuses", async () => {
    const application = await createSellerApplication({
      businessName: "Seller Application Test",
      businessType: "supplier",
      country: "Indonesia",
      contactPerson: "Maya Seller",
      businessEmail: uniqueEmail("seller-application"),
      phoneNumber: "+62812345678",
      companyDescription: "A verified supplier candidate for Buyamia live sourcing rooms.",
      categories: ["Furniture", "Hospitality"],
      productsOrServices: "Rattan furniture, teak tables, and hospitality sourcing support.",
      website: "https://seller.example.test",
      verificationDocuments: [
        {
          documentType: "Business registration",
          fileName: "registration.pdf",
          contentType: "application/pdf",
          size: 12000,
          uploadedAt: new Date().toISOString(),
        },
      ],
    });

    expect(application.status).toBe("submitted");
    expect(application.submittedAt).toBeTruthy();
    expect(await prisma.sellerApplication.findUnique({ where: { id: application.id } })).toBeTruthy();

    const listed = await listSellerApplications({ businessType: "supplier", status: "submitted" });
    expect(listed.some((item) => item.id === application.id)).toBe(true);

    const updated = await updateSellerApplicationStatus(application.id, { status: "under_review" });
    expect(updated.status).toBe("under_review");

    await expect(
      createSellerApplication({
        businessName: "Bad Viewer Application",
        businessType: "viewer",
        country: "Indonesia",
        contactPerson: "Viewer",
        businessEmail: uniqueEmail("bad-seller"),
        phoneNumber: "+62812345678",
        companyDescription: "This role should not be allowed to apply as a seller.",
        categories: ["Other"],
        productsOrServices: "Viewer account",
        verificationDocuments: [{ documentType: "Other supporting document", fileName: "doc.pdf" }],
      }),
    ).rejects.toMatchObject({
      fields: { businessType: expect.any(String) },
    });
  });

  it("calculates replay expiration and sorts active pins first", async () => {
    expect(getReplayStatus(datePlusDays(new Date(), 1)).status).toBe("expiring_soon");
    expect(getReplayStatus(datePlusDays(new Date(), -1)).status).toBe("expired");

    const lives = await getLives();
    const firstNormalIndex = lives.findIndex((live) => !live.isPinned);
    const laterPinnedIndex = lives.findIndex((live, index) => index > firstNormalIndex && live.isPinned);
    expect(laterPinnedIndex).toBe(-1);

    const featured = await getFeaturedSupplierSessions();
    expect(featured.map((item) => item.featureCategory)).toEqual([
      "Recommended",
      "Popular",
      "Nearby",
      "Sponsored",
      "New verified suppliers",
    ]);
    expect(featured.every((item) => item.providerRole === "supplier")).toBe(true);
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

    const dateFrom = datePlusDays(new Date(), 4).toISOString();
    const dateTo = datePlusDays(new Date(), 5).toISOString();
    const dateFiltered = await listLives({ search: prefix, dateFrom, dateTo });
    expect(dateFiltered.items.length).toBeGreaterThan(0);
    expect(dateFiltered.items.every((live) => new Date(live.startsAt) >= new Date(dateFrom) && new Date(live.startsAt) <= new Date(dateTo))).toBe(true);

    const mostViewed = await listLives({ search: prefix, sort: "most_viewed" });
    expect(mostViewed.items[0].id).toBe(created[0].id);

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
    expect(details.trustScore.score).toBeGreaterThanOrEqual(0);
    expect(details.trustScore.score).toBeLessThanOrEqual(100);
    expect(details.transcript.length).toBeGreaterThan(0);
    expect(details.specialistHost?.hostType).toBeTruthy();
    expect(details.commerceData?.products.length).toBeGreaterThan(0);
    expect(details.intentQuestions?.length).toBeGreaterThan(0);
    expect(details.transcript.some((segment) => segment.tags?.includes("MOQ"))).toBe(true);
    expect(details.transcript.some((segment) => segment.tags?.includes("shipping"))).toBe(true);
    expect(details.transcript.some((segment) => segment.tags?.includes("pricing"))).toBe(true);
    expect(details.transcript.some((segment) => segment.tags?.includes("quality"))).toBe(true);
    expect(details.transcript.some((segment) => segment.tags?.includes("RFQ"))).toBe(true);
  });

  it("keeps the viewer dashboard live catalogue as a compact preview", async () => {
    const viewer = await signupUser({
      name: "Catalogue Preview Viewer",
      email: uniqueEmail("catalogue-preview-viewer"),
      password: "Password123!",
      role: "viewer",
    });
    await provider("hotel");

    const dashboard = await getDashboardData("viewer", safeUser(viewer));
    expect(dashboard.liveCatalog?.length ?? 0).toBeLessThanOrEqual(5);
    expect(dashboard.liveCatalog?.every((live) => live.title && live.providerName && live.category)).toBe(true);
  });

  it("keeps the main admin live controls as a global three-item preview without limiting providers", async () => {
    const adminUser = await admin();
    const hotel = await provider("hotel");
    const restaurant = await provider("restaurant");
    const supplier = await provider("supplier");
    const service = await provider("service_provider");
    const owners = [hotel, restaurant, supplier, service];
    const prefix = `Admin preview ${Date.now()}`;

    for (let index = 0; index < owners.length; index += 1) {
      await prisma.live.create({
        data: {
          providerId: owners[index].providerId,
          title: `${prefix} ${index}`,
          category: ["Hotel", "Restaurant", "Furniture", "Services"][index],
          status: index === 0 ? "active" : index === 1 ? "scheduled" : "completed",
          scheduledAt: datePlusDays(new Date(), index + 1),
          startedAt: index === 0 ? datePlusDays(new Date(), -1) : null,
          endedAt: index >= 2 ? datePlusDays(new Date(), -1) : null,
          replayExpiresAt: datePlusDays(new Date(), 7),
          viewerCount: 100000 - index,
          replayViews: 100000 - index,
          isPinned: true,
          pinReason: "featured_by_buyamia",
          priorityScore: 1000,
        },
      });
    }

    const adminDashboard = await getDashboardData("main", safeUser(adminUser));
    expect(adminDashboard.liveCatalog?.length ?? 0).toBeLessThanOrEqual(3);
    expect(adminDashboard.liveCatalog?.map((live) => live.title)).toEqual([
      `${prefix} 0`,
      `${prefix} 1`,
      `${prefix} 2`,
    ]);

    const fullCatalogue = await listLives({ search: prefix, pageSize: 10 });
    expect(fullCatalogue.items).toHaveLength(4);
    expect(new Set(fullCatalogue.items.map((live) => live.providerRole))).toEqual(
      new Set(["hotel", "restaurant", "supplier", "service_provider"]),
    );

    const providerDashboard = await getDashboardData("services", safeUser(service.user));
    expect(providerDashboard.liveCatalog?.length).toBeGreaterThan(0);
    expect(providerDashboard.liveCatalog?.every((live) => live.providerId === service.providerId)).toBe(true);
  });

  it("lets service providers manage their own replay availability", async () => {
    const service = await provider("service_provider");
    const hotel = await provider("hotel");
    const serviceReplay = await prisma.live.create({
      data: {
        providerId: service.providerId,
        title: "Service replay availability test",
        category: "Services",
        status: "completed",
        scheduledAt: datePlusDays(new Date(), -5),
        startedAt: datePlusDays(new Date(), -5),
        endedAt: datePlusDays(new Date(), -5),
        replayExpiresAt: datePlusDays(new Date(), 2),
        commerceData: { schedule: { visibility: "public" } },
      },
    });
    const hotelReplay = await prisma.live.create({
      data: {
        providerId: hotel.providerId,
        title: "Hotel replay availability test",
        category: "Hotel",
        status: "completed",
        scheduledAt: datePlusDays(new Date(), -4),
        startedAt: datePlusDays(new Date(), -4),
        endedAt: datePlusDays(new Date(), -4),
        replayExpiresAt: datePlusDays(new Date(), 2),
      },
    });
    await prisma.analyticsEvent.createMany({
      data: [
        { providerId: service.providerId, liveId: serviceReplay.id, eventType: "replay_viewed" },
        { providerId: service.providerId, liveId: serviceReplay.id, eventType: "replay_viewed" },
      ],
    });

    const listed = await listProviderReplays(service.providerId, { category: "Services", sort: "most_viewed" });
    expect(listed.some((item) => item.id === serviceReplay.id && item.replayViews === 2)).toBe(true);
    expect(listed.every((item) => item.providerId === service.providerId)).toBe(true);

    const expirationDate = datePlusDays(new Date(), 12).toISOString().slice(0, 10);
    const extended = await updateProviderReplayAvailability(service.providerId, serviceReplay.id, {
      expirationDate,
      visibility: "private",
    });
    expect(extended.replay.expiresAt).toBeTruthy();
    expect(((extended.commerceData as { schedule?: { visibility?: string } } | undefined)?.schedule)?.visibility).toBe("private");

    const removed = await updateProviderReplayAvailability(service.providerId, serviceReplay.id, { removeExpiration: true });
    expect(removed.replay.expiresAt).toBe("");

    await expect(
      updateProviderReplayAvailability(service.providerId, hotelReplay.id, { expirationDate }),
    ).rejects.toThrow(/Replay not found/);

    await expect(
      updateProviderReplayAvailability(service.providerId, serviceReplay.id, {
        expirationDate: datePlusDays(new Date(), -1).toISOString().slice(0, 10),
      }),
    ).rejects.toMatchObject({
      fields: { expirationDate: "Expiration date must be in the future." },
    });

    await expect(listProviderReplays(hotel.providerId)).rejects.toThrow(/Only service providers/);
  });

  it("lets service providers submit pinned placement requests for owned content", async () => {
    const service = await provider("service_provider");
    const hotel = await provider("hotel");
    const live = await prisma.live.create({
      data: {
        providerId: service.providerId,
        title: "Service live placement",
        category: "Services",
        status: "scheduled",
        scheduledAt: datePlusDays(new Date(), 4),
        replayExpiresAt: datePlusDays(new Date(), 9),
      },
    });
    const replay = await prisma.live.create({
      data: {
        providerId: service.providerId,
        title: "Service replay placement",
        category: "Services",
        status: "completed",
        scheduledAt: datePlusDays(new Date(), -4),
        startedAt: datePlusDays(new Date(), -4),
        endedAt: datePlusDays(new Date(), -4),
        replayExpiresAt: datePlusDays(new Date(), 5),
      },
    });
    const hotelLive = await prisma.live.create({
      data: {
        providerId: hotel.providerId,
        title: "Hotel placement content",
        category: "Hotel",
        status: "scheduled",
        scheduledAt: datePlusDays(new Date(), 4),
      },
    });

    const options = await getPinnedPlacementOptions(service.providerId);
    expect(options.service.id).toBe(service.providerId);
    expect(options.liveStreams.some((item) => item.id === live.id)).toBe(true);
    expect(options.replays.some((item) => item.id === replay.id)).toBe(true);

    const request = await createPinnedPlacementRequest(service.providerId, {
      contentType: "live_stream",
      contentId: live.id,
      promotionTitle: "Feature our concierge live",
      reason: "This live introduces a seasonal service package for verified buyers.",
      promotionPeriod: "7 days",
      preferredStartDate: datePlusDays(new Date(), 2).toISOString().slice(0, 10),
      preferredEndDate: datePlusDays(new Date(), 9).toISOString().slice(0, 10),
      targetAudience: "Hotel procurement teams",
      additionalNotes: "Prioritize during weekday mornings.",
      status: "submitted",
    });

    expect(request.status).toBe("submitted");
    expect(request.submittedAt).toBeTruthy();
    expect(request.providerId).toBe(service.providerId);
    expect(await prisma.pinnedPlacementRequest.findUnique({ where: { id: request.id } })).toBeTruthy();
    expect((await listPinnedPlacementRequests(service.providerId)).some((item) => item.id === request.id)).toBe(true);

    await expect(
      createPinnedPlacementRequest(service.providerId, {
        contentType: "live_stream",
        contentId: hotelLive.id,
        promotionTitle: "Wrong owner",
        reason: "This should fail because the content belongs to a hotel provider.",
        promotionPeriod: "7 days",
        preferredStartDate: datePlusDays(new Date(), 2).toISOString().slice(0, 10),
        preferredEndDate: datePlusDays(new Date(), 9).toISOString().slice(0, 10),
        targetAudience: "Travel buyers",
      }),
    ).rejects.toThrow(/Selected content/);

    await expect(
      createPinnedPlacementRequest(hotel.providerId, {
        contentType: "service",
        contentId: hotel.providerId,
        promotionTitle: "Wrong role",
        reason: "Hotels cannot use this service placement request flow.",
        promotionPeriod: "7 days",
        preferredStartDate: datePlusDays(new Date(), 2).toISOString().slice(0, 10),
        preferredEndDate: datePlusDays(new Date(), 9).toISOString().slice(0, 10),
        targetAudience: "Travel buyers",
      }),
    ).rejects.toThrow(/Only service providers/);

    await expect(
      createPinnedPlacementRequest(service.providerId, {
        contentType: "replay",
        contentId: replay.id,
        promotionTitle: "Bad date order",
        reason: "The date order should fail validation before submission.",
        promotionPeriod: "7 days",
        preferredStartDate: datePlusDays(new Date(), 9).toISOString().slice(0, 10),
        preferredEndDate: datePlusDays(new Date(), 2).toISOString().slice(0, 10),
        targetAudience: "Travel buyers",
      }),
    ).rejects.toMatchObject({
      fields: { preferredEndDate: "End date must be after start date." },
    });
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
    await prisma.analyticsEvent.createMany({
      data: [
        {
          userId: viewer.id,
          providerId,
          eventType: "conversion_intent",
          conversionSource: "linkedin",
          conversionIntent: "rfq",
        },
        {
          userId: viewer.id,
          providerId,
          eventType: "conversion_intent",
          conversionSource: "shared_link",
          conversionIntent: "sample_request",
        },
      ],
    });

    const providerAnalytics = await getProviderAnalyticsSummary(providerId);
    expect(providerAnalytics.followers).toBe(1);
    expect(providerAnalytics.conversionAttribution.sources.find((source) => source.source === "linkedin")?.conversions).toBe(1);
    expect(providerAnalytics.conversionAttribution.intentBySource.find((source) => source.source === "shared_link")?.intents[0]).toMatchObject({
      intent: "sample_request",
      conversions: 1,
    });
    expect(providerAnalytics.intentInsights.totalSignals).toBeGreaterThan(0);
    const viewerAnalytics = await getViewerAnalyticsSummary(viewer.id);
    expect(viewerAnalytics.followedProviders).toBe(1);
    expect(viewerAnalytics.intentInsights.totalSignals).toBeGreaterThan(0);
    const mainAnalytics = await getMainAnalyticsSummary();
    expect(mainAnalytics.totalUsers).toBeGreaterThan(0);
    expect(mainAnalytics.intentInsights.topBuyerIntent.label).toBeTruthy();

    await unfollowProvider({ viewerUserId: viewer.id, providerId });
    expect(await prisma.follow.count({ where: { viewerId: viewer.id, providerId } })).toBe(0);
  });

  it("keeps viewer subscription dashboard lists as compact previews", async () => {
    const viewer = await signupUser({
      name: "Subscription Preview Viewer",
      email: uniqueEmail("subscription-preview-viewer"),
      password: "Password123!",
      role: "viewer",
    });
    const createProviderFixture = async (index: number, role: "supplier" | "hotel") => {
      const user = await prisma.user.create({
        data: {
          name: `Preview ${role} ${index}`,
          email: uniqueEmail(`preview-${role}`),
          passwordHash: "test-password-hash",
          role,
          providerProfile: {
            create: {
              displayName: `Preview ${role} ${index}`,
              category: role,
              completedOrders: index,
              responseRate: 80,
              responseMinutes: 30,
            },
          },
        },
        include: { providerProfile: true },
      });
      return user.providerProfile!;
    };
    const followedProviders = await Promise.all(Array.from({ length: 6 }, (_, index) => createProviderFixture(index, "supplier")));
    await Promise.all(Array.from({ length: 6 }, (_, index) => createProviderFixture(index, "hotel")));
    for (const item of followedProviders) {
      await followProvider({ viewerUserId: viewer.id, providerId: item.id });
    }

    const dashboard = await getDashboardData("viewer", safeUser(viewer));
    expect(dashboard.subscriptions?.followedProviders?.length ?? 0).toBeLessThanOrEqual(5);
    expect(dashboard.subscriptions?.availableProviders?.length ?? 0).toBeLessThanOrEqual(5);
    expect((await getFollowedProviders(viewer.id)).length).toBeGreaterThan(5);
    expect((await getAvailableProvidersForViewer(viewer.id)).length).toBeGreaterThan(5);
  });

  it("builds procurement agent referral data with live attribution and shareable links", async () => {
    const dashboard = await getProcurementAgentDashboardData();
    expect(dashboard.shareableSessions.length).toBeGreaterThan(0);
    expect(dashboard.referredLives.length).toBeGreaterThan(0);
    expect(dashboard.totalClicks).toBeGreaterThan(0);
    expect(dashboard.estimatedCommission).toBeGreaterThan(0);
    expect(dashboard.conversionAttribution.sources.length).toBeGreaterThan(0);
    expect(dashboard.topPerformingLive?.referralLink).toContain("/live/");
    expect(dashboard.referredLives.every((row) => row.referralLink.includes("/live/"))).toBe(true);
    expect(buildReferralLink("live-demo", "agent-demo")).toContain("ref=procurement-agent");
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
    expect(ranked.find((item) => item.id === providerId)?.trustScore.score).toBeGreaterThanOrEqual(0);

    const detail = await getSupplierDetail(providerId);
    expect(detail.trustScore.breakdown.map((item) => item.label)).toContain("Completed orders");
    expect(detail.trustScore.breakdown.map((item) => item.label)).toContain("B-Impact score");
  });

  it("persists AI sourcing requests and returns mock supplier recommendations", async () => {
    await provider("supplier");
    const response = await createAiSourcingRequest({
      productDescription: "Outdoor rattan lounge chairs for a boutique resort renovation.",
      productCategory: "Furniture",
      quantity: 48,
      targetCountry: "Indonesia",
      preferredSupplierLocation: "Bali",
      budget: 12000,
      moqPreference: "Flexible MOQ under 50 units",
      deliveryDeadline: datePlusDays(new Date(), 21).toISOString(),
      additionalRequirements: "Export-ready packaging and cushion fabric options.",
    });

    expect(response.id).toBeTruthy();
    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.recommendations[0]).toMatchObject({
      productCategory: "Furniture",
      rfqAvailable: true,
    });
    expect(await prisma.aiSourcingRequest.findUnique({ where: { id: response.id } })).toBeTruthy();

    await expect(
      createAiSourcingRequest({
        productDescription: "Too soon",
        productCategory: "Furniture",
        quantity: 1,
        targetCountry: "Indonesia",
        moqPreference: "Any",
        deliveryDeadline: datePlusDays(new Date(), -1).toISOString(),
      }),
    ).rejects.toMatchObject({
      fields: { deliveryDeadline: "Delivery deadline cannot be in the past." },
    });
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

  it("returns scheduled live calendar events with filters and selected live details", async () => {
    const hotel = await provider("hotel");
    const supplier = await provider("supplier");
    const first = await createScheduledStream(hotel.providerId, {
      title: "Calendar suite stream",
      category: "Rooms",
      scheduledAt: datePlusDays(new Date(), 4).toISOString(),
    });
    const second = await createScheduledStream(supplier.providerId, {
      title: "Calendar sourcing stream",
      category: "Furniture",
      scheduledAt: datePlusDays(new Date(), 2).toISOString(),
    });

    const events = await listCalendarEvents({ type: "scheduled_live" });
    const ids = events.map((event) => event.id);
    expect(ids).toContain(`live:${first.id}`);
    expect(ids).toContain(`live:${second.id}`);
    expect(events.every((event) => event.type === "scheduled_live")).toBe(true);
    expect(events.every((event) => event.status === "scheduled")).toBe(true);
    expect(events.map((event) => event.date)).toEqual([...events.map((event) => event.date)].sort());

    const providerEvents = await listCalendarEvents({ type: "scheduled_live", providerId: hotel.providerId });
    expect(providerEvents.some((event) => event.id === `live:${first.id}`)).toBe(true);
    expect(providerEvents.some((event) => event.id === `live:${second.id}`)).toBe(false);

    const categoryEvents = await listCalendarEvents({ type: "scheduled_live", category: "Furniture" });
    expect(categoryEvents.some((event) => event.id === `live:${second.id}`)).toBe(true);
    expect(categoryEvents.every((event) => event.category === "Furniture")).toBe(true);

    const dateFiltered = await listCalendarEvents({
      type: "scheduled_live",
      from: datePlusDays(new Date(), 3).toISOString(),
      to: datePlusDays(new Date(), 5).toISOString(),
    });
    expect(dateFiltered.some((event) => event.id === `live:${first.id}`)).toBe(true);
    expect(dateFiltered.some((event) => event.id === `live:${second.id}`)).toBe(false);

    const selected = await getLiveDetailsById(first.id);
    expect(selected.title).toBe("Calendar suite stream");
    expect(selected.providerId).toBe(hotel.providerId);
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
      ["Open calendar", "/live/calendar"],
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

  it("uses explicit procurement quick action routes", () => {
    const source = readFileSync("app/dashboard-platform.tsx", "utf8");
    for (const label of ["Generate RFQ", "Rank suppliers", "Open negotiation", "Review risk"]) {
      expect(source).toContain(`"${label.toLowerCase()}": "/dashboard/main/`);
    }
    expect(source).toContain('"view calendar": "/live/calendar"');
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
