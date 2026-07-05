import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { fieldErrorsFromZod } from "./validation";
import type { SafeUser } from "./types";

const signalTypes = [
  "question",
  "follow",
  "purchase_intent",
  "replay_view",
  "checkout_click",
  "concierge_request",
] as const;

const signalSchema = z.object({
  signalType: z.enum(signalTypes),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function createViewerSignal(input: {
  liveId: string;
  viewer: SafeUser;
  data: unknown;
}) {
  if (input.viewer.role !== "viewer") {
    throw new ApiError("forbidden", "Only viewers can send live viewer signals.", 403);
  }

  const parsed = signalSchema.safeParse(input.data);
  if (!parsed.success) {
    throw new ValidationApiError(fieldErrorsFromZod(parsed.error));
  }

  const live = await prisma.live.findUnique({ where: { id: input.liveId }, select: { id: true } });
  if (!live) {
    throw new ApiError("not_found", "Live not found.", 404);
  }

  return prisma.liveViewerSignal.create({
    data: {
      liveId: input.liveId,
      viewerId: input.viewer.id,
      signalType: parsed.data.signalType,
      payload: parsed.data.payload as Prisma.InputJsonValue,
    },
  });
}

export async function listRecentViewerSignals(liveId: string, limit = 20) {
  return prisma.liveViewerSignal.findMany({
    where: { liveId },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 100)),
    include: { viewer: { select: { id: true, name: true } } },
  });
}

export async function getSignalCounts(liveId: string) {
  const rows = await prisma.liveViewerSignal.groupBy({
    by: ["signalType"],
    where: { liveId },
    _count: { _all: true },
  });

  return Object.fromEntries(rows.map((row) => [row.signalType, row._count._all])) as Partial<Record<(typeof signalTypes)[number], number>>;
}
