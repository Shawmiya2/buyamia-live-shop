import type { ReplayStatus } from "./types";

export const defaultReplayAvailabilityDays = 5;

export function datePlusDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getReplayStatus(expiresAt?: Date | string | null, now = new Date()): {
  daysRemaining: number;
  status: ReplayStatus;
} {
  if (!expiresAt) {
    return { daysRemaining: 0, status: "expired" };
  }

  const expiry = new Date(expiresAt);
  const msRemaining = expiry.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / 86_400_000));

  if (daysRemaining <= 0) {
    return { daysRemaining: 0, status: "expired" };
  }

  return {
    daysRemaining,
    status: daysRemaining <= 2 ? "expiring_soon" : "active",
  };
}

export const calculateReplayStatus = getReplayStatus;

export function createMockReplayWindow(input: {
  availableFrom: string;
  now?: Date;
  availabilityDays?: number;
  planLabel?: string;
  priceLabel?: string;
}) {
  const availableFrom = new Date(input.availableFrom);
  const expiresAt = datePlusDays(
    availableFrom,
    input.availabilityDays ?? defaultReplayAvailabilityDays,
  );
  const replay = getReplayStatus(expiresAt, input.now ?? new Date());

  return {
    availableFrom: availableFrom.toISOString(),
    expiresAt: expiresAt.toISOString(),
    daysRemaining: replay.daysRemaining,
    status: replay.status,
    extensionAvailable: true,
    extensionDays: input.availabilityDays ?? defaultReplayAvailabilityDays,
    planLabel: input.planLabel ?? "Replay extension",
    priceLabel: input.priceLabel ?? "Payment placeholder: not connected",
  };
}
