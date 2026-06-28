import type { TastingStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";

const tastingStatuses = ["draft", "scheduled", "published", "fully_booked", "completed", "cancelled"] as const;
const tastingTypes = ["in_person", "live", "hybrid"] as const;

const tastingSchema = z
  .object({
    title: z.string().trim().min(1, "Please enter a tasting title."),
    restaurantName: z.string().trim().min(1, "Please enter the restaurant name."),
    description: z.string().trim().min(10, "Please describe the tasting experience."),
    cuisineCategory: z.string().trim().min(1, "Please enter a cuisine category."),
    tastingType: z.enum(tastingTypes, "Please select a valid tasting type."),
    date: z.string().trim().min(1, "Please select a date."),
    time: z.string().trim().min(1, "Please select a time."),
    durationMinutes: z.coerce.number().int().positive("Please enter a valid duration."),
    maxParticipants: z.coerce.number().int().positive("Please enter a participant limit."),
    price: z.coerce.number().int().min(0, "Price cannot be negative.").optional().or(z.literal("").transform(() => undefined)),
    location: z.string().trim().min(1, "Please enter a location or Online."),
    featuredImageUrl: z.union([z.url("Please enter a valid featured image URL."), z.literal("")]).optional(),
    additionalNotes: z.string().trim().optional(),
    status: z.enum(tastingStatuses).default("scheduled"),
  })
  .superRefine((value, context) => {
    const scheduledAt = new Date(`${value.date}T${value.time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      context.addIssue({ code: "custom", path: ["date"], message: "Please select a valid date and time." });
      return;
    }
    if (scheduledAt <= new Date()) {
      context.addIssue({ code: "custom", path: ["date"], message: "Tasting date and time must be in the future." });
    }
  });

function parseTastingInput(input: unknown) {
  const parsed = tastingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }
  return parsed.data;
}

export async function createTasting(providerId: string, input: unknown) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) {
    throw new ApiError("not_found", "Provider not found.", 404);
  }
  if (provider.category !== "restaurant") {
    throw new ApiError("forbidden", "Only restaurant providers can create tastings.", 403);
  }

  const parsed = parseTastingInput(input);
  const scheduledAt = new Date(`${parsed.date}T${parsed.time}`);
  return prisma.tasting.create({
    data: {
      providerId,
      status: parsed.status as TastingStatus,
      title: parsed.title,
      restaurantName: parsed.restaurantName,
      description: parsed.description,
      cuisineCategory: parsed.cuisineCategory,
      tastingType: parsed.tastingType,
      scheduledAt,
      durationMinutes: parsed.durationMinutes,
      maxParticipants: parsed.maxParticipants,
      price: parsed.price,
      location: parsed.location,
      featuredImageUrl: parsed.featuredImageUrl || null,
      additionalNotes: parsed.additionalNotes || null,
    },
  });
}

export async function getRestaurantForTasting(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    select: { id: true, displayName: true, category: true },
  });
  if (!provider) {
    throw new ApiError("not_found", "Restaurant provider not found.", 404);
  }
  if (provider.category !== "restaurant") {
    throw new ApiError("forbidden", "Only restaurant providers can create tastings.", 403);
  }
  return { id: provider.id, displayName: provider.displayName };
}

export async function listTastings(providerId?: string) {
  return prisma.tasting.findMany({
    where: { providerId },
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    include: { provider: { select: { displayName: true, category: true } } },
  });
}
