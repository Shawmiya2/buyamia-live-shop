import type { MenuHighlightStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";

const highlightStatuses = ["draft", "scheduled", "active", "expired", "archived"] as const;
const availabilityStatuses = ["available", "limited", "sold_out", "seasonal"] as const;
const visibilityStatuses = ["public", "private", "live_only"] as const;
const highlightSorts = ["newest", "oldest", "highest_priority", "alphabetical", "active"] as const;

const menuHighlightBaseSchema = z.object({
  dishName: z.string().trim().min(1, "Please enter the dish name."),
  category: z.string().trim().min(1, "Please enter a category."),
  shortDescription: z.string().trim().min(10, "Please enter a short description."),
  price: z.coerce.number().int().min(0, "Please enter a valid price."),
  availabilityStatus: z.enum(availabilityStatuses, "Please select a valid availability status."),
  featuredImageUrl: z.union([z.url("Please enter a valid featured image URL."), z.literal("")]).optional(),
  featuredBadge: z.string().trim().optional(),
  priorityLevel: z.coerce.number().int().min(1, "Priority must be between 1 and 10.").max(10, "Priority must be between 1 and 10."),
  startDate: z.string().trim().min(1, "Please select a start date."),
  endDate: z.string().trim().min(1, "Please select an end date."),
  visibilityStatus: z.enum(visibilityStatuses, "Please select a valid visibility status."),
  isPinned: z.coerce.boolean().default(false),
  status: z.enum(highlightStatuses).default("scheduled"),
});

const menuHighlightSchema = menuHighlightBaseSchema.superRefine((value, context) => {
    const startDate = new Date(`${value.startDate}T00:00:00`);
    const endDate = new Date(`${value.endDate}T23:59:59`);
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

const menuHighlightUpdateSchema = menuHighlightBaseSchema.partial().superRefine((value, context) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return;
  }
  if (value.startDate && value.endDate) {
    const startDate = new Date(`${value.startDate}T00:00:00`);
    const endDate = new Date(`${value.endDate}T23:59:59`);
    if (Number.isNaN(startDate.getTime())) {
      context.addIssue({ code: "custom", path: ["startDate"], message: "Please select a valid start date." });
    }
    if (Number.isNaN(endDate.getTime())) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "Please select a valid end date." });
    }
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after start date." });
    }
  }
});

export type MenuHighlightFilters = {
  search?: string;
  category?: string;
  availabilityStatus?: string;
  status?: string;
  date?: string;
  featured?: string;
  sort?: string;
};

async function assertRestaurantProvider(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    select: { id: true, displayName: true, category: true },
  });
  if (!provider) {
    throw new ApiError("not_found", "Restaurant provider not found.", 404);
  }
  if (provider.category !== "restaurant") {
    throw new ApiError("forbidden", "Only restaurant providers can manage menu highlights.", 403);
  }
  return provider;
}

function parseCreate(input: unknown) {
  const parsed = menuHighlightSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }
  return parsed.data;
}

function parseUpdate(input: unknown) {
  const parsed = menuHighlightUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }
  return parsed.data;
}

function dateRange(startDate?: string, endDate?: string) {
  return {
    startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
  };
}

export async function createMenuHighlight(providerId: string, input: unknown) {
  await assertRestaurantProvider(providerId);
  const parsed = parseCreate(input);
  const dates = dateRange(parsed.startDate, parsed.endDate);
  return prisma.menuHighlight.create({
    data: {
      providerId,
      dishName: parsed.dishName,
      category: parsed.category,
      shortDescription: parsed.shortDescription,
      price: parsed.price,
      availabilityStatus: parsed.availabilityStatus,
      featuredImageUrl: parsed.featuredImageUrl || null,
      featuredBadge: parsed.featuredBadge || null,
      priorityLevel: parsed.priorityLevel,
      startDate: dates.startDate!,
      endDate: dates.endDate!,
      visibilityStatus: parsed.visibilityStatus,
      isPinned: parsed.isPinned,
      status: parsed.status as MenuHighlightStatus,
    },
  });
}

export async function listMenuHighlights(providerId: string | undefined, filters: MenuHighlightFilters = {}) {
  if (providerId) {
    await assertRestaurantProvider(providerId);
  }
  const where: Prisma.MenuHighlightWhereInput = { providerId };
  if (filters.search) {
    where.OR = [
      { dishName: { contains: filters.search } },
      { shortDescription: { contains: filters.search } },
    ];
  }
  if (filters.category) where.category = { contains: filters.category };
  if (filters.availabilityStatus && availabilityStatuses.includes(filters.availabilityStatus as (typeof availabilityStatuses)[number])) {
    where.availabilityStatus = filters.availabilityStatus;
  }
  if (filters.status && highlightStatuses.includes(filters.status as MenuHighlightStatus)) {
    where.status = filters.status as MenuHighlightStatus;
  }
  if (filters.featured === "featured") where.isPinned = true;
  if (filters.featured === "not_featured") where.isPinned = false;
  if (filters.date) {
    const date = new Date(`${filters.date}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
      where.startDate = { lte: date };
      where.endDate = { gte: date };
    }
  }

  const sort = highlightSorts.includes(filters.sort as (typeof highlightSorts)[number]) ? filters.sort : "active";
  const orderBy: Prisma.MenuHighlightOrderByWithRelationInput[] =
    sort === "oldest"
      ? [{ createdAt: "asc" }]
      : sort === "newest"
        ? [{ createdAt: "desc" }]
        : sort === "highest_priority"
          ? [{ priorityLevel: "desc" }, { isPinned: "desc" }]
          : sort === "alphabetical"
            ? [{ dishName: "asc" }]
            : [{ isPinned: "desc" }, { priorityLevel: "desc" }, { startDate: "asc" }];

  return prisma.menuHighlight.findMany({
    where,
    orderBy,
    include: { provider: { select: { displayName: true, category: true } } },
  });
}

export async function getMenuHighlight(providerId: string, highlightId: string) {
  await assertRestaurantProvider(providerId);
  const highlight = await prisma.menuHighlight.findFirst({
    where: { id: highlightId, providerId },
    include: { provider: { select: { displayName: true, category: true } } },
  });
  if (!highlight) {
    throw new ApiError("not_found", "Menu highlight not found.", 404);
  }
  return highlight;
}

export async function updateMenuHighlight(providerId: string, highlightId: string, input: unknown) {
  await getMenuHighlight(providerId, highlightId);
  const parsed = parseUpdate(input);
  const data: Prisma.MenuHighlightUpdateInput = {};
  if (parsed.dishName !== undefined) data.dishName = parsed.dishName;
  if (parsed.category !== undefined) data.category = parsed.category;
  if (parsed.shortDescription !== undefined) data.shortDescription = parsed.shortDescription;
  if (parsed.price !== undefined) data.price = parsed.price;
  if (parsed.availabilityStatus !== undefined) data.availabilityStatus = parsed.availabilityStatus;
  if (parsed.featuredImageUrl !== undefined) data.featuredImageUrl = parsed.featuredImageUrl || null;
  if (parsed.featuredBadge !== undefined) data.featuredBadge = parsed.featuredBadge || null;
  if (parsed.priorityLevel !== undefined) data.priorityLevel = parsed.priorityLevel;
  if (parsed.visibilityStatus !== undefined) data.visibilityStatus = parsed.visibilityStatus;
  if (parsed.isPinned !== undefined) data.isPinned = parsed.isPinned;
  if (parsed.status !== undefined) data.status = parsed.status as MenuHighlightStatus;
  if (parsed.startDate !== undefined) data.startDate = new Date(`${parsed.startDate}T00:00:00`);
  if (parsed.endDate !== undefined) data.endDate = new Date(`${parsed.endDate}T23:59:59`);

  return prisma.menuHighlight.update({
    where: { id: highlightId },
    data,
    include: { provider: { select: { displayName: true, category: true } } },
  });
}

export async function deleteMenuHighlight(providerId: string, highlightId: string) {
  await getMenuHighlight(providerId, highlightId);
  await prisma.menuHighlight.delete({ where: { id: highlightId } });
  return { id: highlightId, deleted: true };
}
