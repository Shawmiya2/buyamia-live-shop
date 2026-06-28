import type { BookingPushStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";

const bookingPushStatuses = ["draft", "scheduled", "active", "paused", "expired", "archived"] as const;

const bookingPushSchema = z
  .object({
    campaignTitle: z.string().trim().min(1, "Please enter a campaign title."),
    hotelName: z.string().trim().min(1, "Please enter the hotel name."),
    promotionDescription: z.string().trim().min(10, "Please describe the promotion."),
    roomType: z.string().trim().min(1, "Please enter a room type."),
    bookingOffer: z.string().trim().min(1, "Please enter the booking offer."),
    discountPercentage: z.coerce.number().int().min(0).max(100).optional().or(z.literal("").transform(() => undefined)),
    startDate: z.string().trim().min(1, "Please select a start date."),
    endDate: z.string().trim().min(1, "Please select an end date."),
    availableRooms: z.coerce.number().int().positive("Please enter available rooms."),
    targetAudience: z.string().trim().min(1, "Please enter a target audience."),
    featuredImageUrl: z.union([z.url("Please enter a valid featured image URL."), z.literal("")]).optional(),
    callToActionText: z.string().trim().min(1, "Please enter call-to-action text."),
    status: z.enum(bookingPushStatuses).default("scheduled"),
  })
  .superRefine((value, context) => {
    const startDate = new Date(value.startDate);
    const endDate = new Date(value.endDate);
    if (Number.isNaN(startDate.getTime())) {
      context.addIssue({ code: "custom", path: ["startDate"], message: "Please select a valid start date." });
    }
    if (Number.isNaN(endDate.getTime())) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "Please select a valid end date." });
    }
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after start date." });
    }
  });

function parseBookingPushInput(input: unknown) {
  const parsed = bookingPushSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }
  return parsed.data;
}

export async function createBookingPush(providerId: string, input: unknown) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Provider not found.", 404);
  }
  if (provider.category !== "hotel") {
    throw new ApiError("forbidden", "Only hotel providers can create booking pushes.", 403);
  }

  const parsed = parseBookingPushInput(input);
  return prisma.bookingPush.create({
    data: {
      providerId,
      status: parsed.status as BookingPushStatus,
      campaignTitle: parsed.campaignTitle,
      hotelName: parsed.hotelName,
      promotionDescription: parsed.promotionDescription,
      roomType: parsed.roomType,
      bookingOffer: parsed.bookingOffer,
      discountPercentage: parsed.discountPercentage,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      availableRooms: parsed.availableRooms,
      targetAudience: parsed.targetAudience,
      featuredImageUrl: parsed.featuredImageUrl || null,
      callToActionText: parsed.callToActionText,
    },
  });
}

export async function listBookingPushes(providerId?: string) {
  return prisma.bookingPush.findMany({
    where: { providerId },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: { provider: { select: { displayName: true, category: true } } },
  });
}
