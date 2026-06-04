import type { LiveReplay, ReplayStatus } from "./types";

export const defaultReplayAvailabilityDays = 5;
const dayMs = 86_400_000;

export function datePlusDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function calculateReplayStatus(expiresAt: string, now = new Date()) {
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / dayMs));
  let status: ReplayStatus = "active";

  if (daysRemaining <= 0) {
    status = "expired";
  } else if (daysRemaining <= 2) {
    status = "expiring_soon";
  }

  return { daysRemaining, status };
}

export function createMockReplayWindow(input: {
  availableFrom: string;
  now?: Date;
  availabilityDays?: number;
  extensionDays?: number;
  planLabel?: string;
  priceLabel?: string;
}): LiveReplay {
  const availabilityDays =
    input.availabilityDays ?? defaultReplayAvailabilityDays;
  const expiresAt = datePlusDays(
    new Date(input.availableFrom),
    availabilityDays,
  ).toISOString();

  return {
    availableFrom: input.availableFrom,
    expiresAt,
    ...calculateReplayStatus(expiresAt, input.now),
    extensionAvailable: true,
    extensionDays: input.extensionDays ?? defaultReplayAvailabilityDays,
    planLabel: input.planLabel ?? "Replay boost extension",
    priceLabel: input.priceLabel ?? "Mock paid extension",
  };
}
