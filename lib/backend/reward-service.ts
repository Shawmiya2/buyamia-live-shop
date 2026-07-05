import type { RewardReason } from "@prisma/client";

export const ambassadorRewardRules = {
  referral_signup: {
    points: 100,
    label: "Referral signup",
    description: "Awarded when a referred person signs up in the demo flow.",
  },
  provider_follow: {
    points: 10,
    label: "Provider follow",
    description: "Awarded when an ambassador helps generate provider follow engagement.",
  },
  live_share: {
    points: 15,
    label: "Live share",
    description: "Awarded when an ambassador shares a live session.",
  },
  replay_share: {
    points: 10,
    label: "Replay share",
    description: "Awarded when an ambassador shares replay content.",
  },
  community_engagement: {
    points: 5,
    label: "Community engagement",
    description: "Awarded for lightweight trusted community actions.",
  },
  order_value: {
    pointsPerCurrencyUnit: 1,
    label: "Order value",
    description: "Demo conversion rule: one point per local currency unit recorded as sourceAmount. No payout is created.",
  },
} as const;

export function calculateRewardPoints(input: {
  reason: RewardReason;
  sourceAmount?: number | null;
}) {
  if (input.reason === "order_value") {
    return Math.max(0, Math.floor(input.sourceAmount ?? 0));
  }

  return ambassadorRewardRules[input.reason].points;
}

export function calculateAmbassadorTier(totalPoints: number) {
  if (totalPoints >= 2500) return "elite";
  if (totalPoints >= 1000) return "community_leader";
  if (totalPoints >= 300) return "trusted";
  return "starter";
}
