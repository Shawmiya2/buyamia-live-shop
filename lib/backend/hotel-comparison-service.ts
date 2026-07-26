import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { calculateSupplierTrustScore } from "./trust-score-service";
import { fieldErrorsFromZod } from "./validation";
import type { SafeUser } from "./types";

const hotelQuerySchema = z.object({
  ids: z.array(z.string().trim().min(1)).max(4, "You can compare up to four hotels.").default([]),
});

export async function listHotelsForComparison(user: SafeUser, input: unknown = {}) {
  if (user.role !== "viewer") {
    throw new ApiError("forbidden", "Only authenticated viewers can compare hotels.", 403);
  }

  const parsed = hotelQuerySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const hotels = await prisma.providerProfile.findMany({
    where: {
      category: "hotel",
      ...(parsed.data.ids.length ? { id: { in: parsed.data.ids } } : {}),
    },
    include: {
      user: { select: { verificationStatus: true } },
      lives: {
        select: {
          id: true,
          status: true,
          isPinned: true,
          pinExpiresAt: true,
          viewerCount: true,
          replayViews: true,
        },
      },
      bookingPushes: {
        select: {
          status: true,
          startDate: true,
          endDate: true,
          availableRooms: true,
        },
      },
    },
    orderBy: { displayName: "asc" },
  });

  if (parsed.data.ids.length && hotels.length !== new Set(parsed.data.ids).size) {
    throw new ApiError("not_found", "One or more selected hotels could not be found.", 404);
  }

  const now = new Date();
  return hotels.map((hotel) => {
    const locationParts = (hotel.location ?? "").split(",").map((part) => part.trim()).filter(Boolean);
    const activeBookingPushes = hotel.bookingPushes.filter(
      (push) =>
        (push.status === "active" || push.status === "scheduled") &&
        push.startDate <= now &&
        push.endDate >= now &&
        push.availableRooms > 0,
    );
    const trustScore = calculateSupplierTrustScore(
      hotel,
      hotel.lives.filter((live) => live.status === "completed").length,
    ).score;

    return {
      id: hotel.id,
      name: hotel.displayName,
      country: locationParts.length > 1 ? locationParts.at(-1) ?? null : null,
      city: locationParts.length > 1 ? locationParts.slice(0, -1).join(", ") : (locationParts[0] ?? null),
      category: "Hotel",
      description: hotel.description,
      website: hotel.website,
      rating: null,
      reviewCount: hotel.certifiedReviews,
      priceRange: null,
      availableLiveSessions: hotel.lives.filter((live) => live.status === "active" || live.status === "scheduled").length,
      amenities: [] as string[],
      languages: [] as string[],
      trustScore,
      bookingAvailability: activeBookingPushes.reduce((total, push) => total + push.availableRooms, 0),
      featured: hotel.lives.some(
        (live) => live.isPinned && (!live.pinExpiresAt || live.pinExpiresAt > now),
      ),
      popularity: hotel.lives.reduce((total, live) => total + live.viewerCount + live.replayViews, 0),
      verified: hotel.user.verificationStatus === "verified",
    };
  });
}
