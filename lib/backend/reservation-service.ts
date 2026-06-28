import type { Prisma, ReservationStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";

const reservationStatuses = ["pending", "confirmed", "rescheduled", "completed", "cancelled", "no_show"] as const;
const reservationScopes = ["all", "upcoming", "past"] as const;
const reservationSorts = ["newest", "oldest", "closest", "largest_party"] as const;

const createReservationSchema = z.object({
  customerName: z.string().trim().min(1, "Please enter the customer name."),
  date: z.string().trim().min(1, "Please select a reservation date."),
  time: z.string().trim().min(1, "Please select a reservation time."),
  partySize: z.coerce.number().int().positive("Please enter a valid party size."),
  status: z.enum(reservationStatuses).default("pending"),
  bookingReference: z.string().trim().min(1, "Please enter a booking reference."),
  notes: z.string().trim().optional(),
});

const updateReservationSchema = z
  .object({
    date: z.string().trim().optional(),
    time: z.string().trim().optional(),
    partySize: z.coerce.number().int().positive("Please enter a valid party size.").optional(),
    status: z.enum(reservationStatuses).optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if ((value.date && !value.time) || (!value.date && value.time)) {
      context.addIssue({ code: "custom", path: ["date"], message: "Please provide both date and time to reschedule." });
    }
    if (value.date && value.time && Number.isNaN(new Date(`${value.date}T${value.time}`).getTime())) {
      context.addIssue({ code: "custom", path: ["date"], message: "Please select a valid reservation date and time." });
    }
  });

export type ReservationFilters = {
  date?: string;
  status?: string;
  partySize?: string;
  customerName?: string;
  scope?: string;
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
    throw new ApiError("forbidden", "Only restaurant providers can manage reservations.", 403);
  }
  return provider;
}

function parseReservationAt(date: string, time: string) {
  const reservationAt = new Date(`${date}T${time}`);
  if (Number.isNaN(reservationAt.getTime())) {
    throw new ValidationApiError({ date: "Please select a valid reservation date and time." });
  }
  return reservationAt;
}

export async function createReservation(providerId: string, input: unknown) {
  await assertRestaurantProvider(providerId);
  const parsed = createReservationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  return prisma.reservation.create({
    data: {
      providerId,
      customerName: parsed.data.customerName,
      reservationAt: parseReservationAt(parsed.data.date, parsed.data.time),
      partySize: parsed.data.partySize,
      status: parsed.data.status as ReservationStatus,
      bookingReference: parsed.data.bookingReference,
      notes: parsed.data.notes || null,
    },
  });
}

export async function listReservations(providerId: string | undefined, filters: ReservationFilters = {}) {
  if (providerId) {
    await assertRestaurantProvider(providerId);
  }

  const where: Prisma.ReservationWhereInput = { providerId };
  if (filters.status && reservationStatuses.includes(filters.status as ReservationStatus)) {
    where.status = filters.status as ReservationStatus;
  }
  if (filters.customerName) {
    where.customerName = { contains: filters.customerName };
  }
  if (filters.partySize) {
    const partySize = Number(filters.partySize);
    if (Number.isInteger(partySize) && partySize > 0) {
      where.partySize = partySize;
    }
  }
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00`);
    const end = new Date(`${filters.date}T23:59:59`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      where.reservationAt = { gte: start, lte: end };
    }
  }
  if (filters.scope && reservationScopes.includes(filters.scope as (typeof reservationScopes)[number])) {
    if (filters.scope === "upcoming") {
      where.reservationAt = { ...(typeof where.reservationAt === "object" ? where.reservationAt : {}), gte: new Date() };
    }
    if (filters.scope === "past") {
      where.reservationAt = { ...(typeof where.reservationAt === "object" ? where.reservationAt : {}), lt: new Date() };
    }
  }

  const sort = reservationSorts.includes(filters.sort as (typeof reservationSorts)[number]) ? filters.sort : "closest";
  const orderBy: Prisma.ReservationOrderByWithRelationInput[] =
    sort === "oldest"
      ? [{ createdAt: "asc" }]
      : sort === "newest"
        ? [{ createdAt: "desc" }]
        : sort === "largest_party"
          ? [{ partySize: "desc" }, { reservationAt: "asc" }]
          : [{ reservationAt: "asc" }];

  return prisma.reservation.findMany({
    where,
    orderBy,
    include: { provider: { select: { displayName: true, category: true } } },
  });
}

export async function getReservation(providerId: string, reservationId: string) {
  await assertRestaurantProvider(providerId);
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, providerId },
    include: { provider: { select: { displayName: true, category: true } } },
  });
  if (!reservation) {
    throw new ApiError("not_found", "Reservation not found.", 404);
  }
  return reservation;
}

export async function updateReservation(providerId: string, reservationId: string, input: unknown) {
  await getReservation(providerId, reservationId);
  const parsed = updateReservationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const data: Prisma.ReservationUpdateInput = {};
  if (parsed.data.status) data.status = parsed.data.status as ReservationStatus;
  if (parsed.data.partySize !== undefined) data.partySize = parsed.data.partySize;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;
  if (parsed.data.date && parsed.data.time) {
    data.reservationAt = parseReservationAt(parsed.data.date, parsed.data.time);
    if (!parsed.data.status) data.status = "rescheduled";
  }

  return prisma.reservation.update({
    where: { id: reservationId },
    data,
    include: { provider: { select: { displayName: true, category: true } } },
  });
}
