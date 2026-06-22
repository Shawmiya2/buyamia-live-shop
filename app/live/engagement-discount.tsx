"use client";

import { useEffect, useState } from "react";

type Milestone = {
  target: number;
  reward: string;
  duration: number;
  product: string;
  tone: string;
};

const milestones: Milestone[] = [
  {
    target: 20000,
    reward: "30% discount",
    duration: 30,
    product: "Rattan lounge chair",
    tone: "Flash price",
  },
  {
    target: 50000,
    reward: "Free instant delivery",
    duration: 45,
    product: "Outdoor daybed",
    tone: "Logistics unlock",
  },
  {
    target: 100000,
    reward: "VIP bundle unlock",
    duration: 60,
    product: "Resort rattan bundle",
    tone: "Private offer",
  },
];

const products = [
  ["Rattan lounge chair", "$68/unit", "30% community price"],
  ["Outdoor daybed", "$124/unit", "Free instant delivery"],
  ["Resort rattan bundle", "$248 set", "VIP bundle access"],
];

const sellerProducts = [
  "Rattan lounge chair",
  "Outdoor daybed",
  "Resort rattan bundle",
];

const rewardTypes = ["Discount", "Free delivery", "VIP bundle"];
const reactionGlyphs = ["♥", "★", "+", "♡", "✦"];

function formatLikes(likes: number) {
  if (likes >= 1000000) return `${(likes / 1000000).toFixed(1)}M`;
  if (likes >= 1000) return `${(likes / 1000).toFixed(1)}k`;
  return likes.toString();
}

export function EngagementDiscountPanel() {
  const [likes, setLikes] = useState(18420);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reactionBurst, setReactionBurst] = useState(0);
  const [configuredReward, setConfiguredReward] = useState(rewardTypes[0]);
  const [configuredProduct, setConfiguredProduct] = useState(sellerProducts[0]);
  const [configuredDuration, setConfiguredDuration] = useState(30);
  const [dealMessage, setDealMessage] = useState("");

  const nextMilestone =
    milestones.find((milestone) => likes < milestone.target) ??
    milestones[milestones.length - 1];

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const addLikes = (amount: number) => {
    const nextLikes = likes + amount;
    const crossedMilestone =
      [...milestones]
        .reverse()
        .find(
          (milestone) => likes < milestone.target && nextLikes >= milestone.target,
        ) ?? null;

    setLikes(nextLikes);
    setReactionBurst((value) => value + 1);

    if (crossedMilestone) {
      setActiveMilestone(crossedMilestone);
      setSecondsLeft(crossedMilestone.duration);
    }
  };

  return (
    <section className="px-5 pb-16 sm:px-7 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-xl shadow-[#8a7d61]/10 sm:p-6">
          {activeMilestone && secondsLeft > 0 && (
            <div className="absolute inset-x-4 top-4 z-20 rounded-full bg-[#1f251a] px-4 py-2 text-center text-xs font-black uppercase tracking-[.16em] text-[#fffaf0] shadow-2xl shadow-[#1f251a]/20 [animation:livePulse_1.8s_ease-in-out_infinite]">
              Discount unlocked - {activeMilestone.reward}
            </div>
          )}

          {activeMilestone && secondsLeft > 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
              {Array.from({ length: 14 }).map((_, index) => (
                <span
                  key={`${reactionBurst}-${index}`}
                  className="absolute size-1.5 rounded-full bg-[#cbd8a7] opacity-80"
                  style={{
                    left: `${8 + ((index * 13) % 84)}%`,
                    top: `${10 + ((index * 19) % 72)}%`,
                    animation: `tinyRise ${2.4 + (index % 5) * 0.28}s ease-out ${
                      index * 0.05
                    }s both`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative z-10 pt-10 sm:pt-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-[#6f7f4f]">
                  Community unlocks
                </p>
                <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-4xl">
                  Likes unlock live flash rewards.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#675f50]">
                  The audience pushes the stream toward temporary rewards:
                  discounts, free instant delivery, and private bundles that
                  expire fast enough to create real urgency.
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[#f3ecdc] p-4 sm:min-w-44">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                  Live likes
                </p>
                <p className="mt-1 text-3xl font-semibold">
                  {formatLikes(likes)}
                </p>
                <p className="mt-1 text-xs text-[#675f50]">
                  Next: {formatLikes(nextMilestone.target)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {milestones.map((milestone) => {
                const progress = Math.min(100, (likes / milestone.target) * 100);
                const isUnlocked = likes >= milestone.target;
                const isActive =
                  activeMilestone?.target === milestone.target && secondsLeft > 0;

                return (
                  <div
                    key={milestone.target}
                    className={`rounded-[1.35rem] border p-4 transition ${
                      isActive
                        ? "border-[#6f7f4f] bg-[#f3ecdc] shadow-lg shadow-[#6f7f4f]/10"
                        : "border-[#ded4c2] bg-white/45"
                    }`}
                  >
                    <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatLikes(milestone.target)} likes -{" "}
                          {milestone.reward}
                        </p>
                        <p className="mt-1 text-xs text-[#675f50]">
                          {milestone.product} - {milestone.duration}s live window
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                          isUnlocked
                            ? "bg-[#6f7f4f] text-white"
                            : "bg-[#efe5d2] text-[#596540]"
                        }`}
                      >
                        {isActive
                          ? `${secondsLeft}s left`
                          : isUnlocked
                            ? "Unlocked"
                            : milestone.tone}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#ded4c2]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isActive ? "bg-[#b85438]" : "bg-[#6f7f4f]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => addLikes(850)}
                className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1f251a]/25"
              >
                Send reaction
              </button>
              <button
                type="button"
                onClick={() => addLikes(2500)}
                className="rounded-full bg-[#6f7f4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/35"
              >
                Audience surge
              </button>
            </div>

            <div className="pointer-events-none absolute bottom-6 right-5 z-20 hidden h-40 w-20 sm:block">
              {reactionGlyphs.map((reaction, index) => (
                <span
                  key={`${reactionBurst}-${reaction}-${index}`}
                  className="absolute bottom-0 grid size-9 place-items-center rounded-full bg-[#fffaf0]/78 text-sm font-black text-[#596540] shadow-xl shadow-[#8a7d61]/10 backdrop-blur-xl"
                  style={{
                    right: `${(index % 3) * 14}px`,
                    animation: `tinyRise ${3.6 + index * 0.24}s ease-in-out ${
                      index * 0.18
                    }s infinite`,
                  }}
                >
                  {reaction}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#cbd8a7]">
                  Limited flash deals
                </p>
                <h3 className="mt-2 font-serif text-2xl leading-tight">
                  Reward windows convert attention into action.
                </h3>
              </div>
              {activeMilestone && secondsLeft > 0 && (
                <span className="shrink-0 rounded-full bg-[#fffaf0] px-3 py-1.5 text-xs font-black text-[#1f251a]">
                  {secondsLeft}s
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-3">
              {products.map(([name, price, reward]) => {
                const isAffected = activeMilestone?.product === name;

                return (
                  <div
                    key={name}
                    className={`rounded-[1.4rem] border p-4 transition ${
                      isAffected && secondsLeft > 0
                        ? "border-[#cbd8a7] bg-white/[.12] shadow-xl shadow-[#cbd8a7]/10 [animation:pinGlow_2.6s_ease-in-out_infinite]"
                        : "border-white/10 bg-white/[.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{name}</p>
                        <p className="mt-1 text-xs text-[#ded7c9]">{price}</p>
                      </div>
                      <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">
                        {reward}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDealMessage(
                          isAffected && secondsLeft > 0
                            ? `${name} demo deal staged. Real checkout requires a payment provider.`
                            : `${name} needs an active reward window before it can be claimed.`,
                        )
                      }
                      className="mt-4 w-full rounded-full bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#1f251a] transition hover:bg-white"
                    >
                      {isAffected && secondsLeft > 0
                        ? "Claim unlocked deal"
                        : "Watch for unlock"}
                    </button>
                  </div>
                );
              })}
            </div>
            {dealMessage && (
              <p className="mt-3 rounded-2xl bg-white/[.1] p-3 text-sm font-semibold text-[#cbd8a7]">
                {dealMessage}
              </p>
            )}
          </div>

          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Seller reward configuration
            </p>
            <p className="mt-2 text-sm leading-6 text-[#675f50]">
              Sellers can tune milestone targets, reward type, reward duration,
              and which products are affected before going live.
            </p>

            <div className="mt-5 grid gap-3">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#8a826f]">
                  Reward type
                </p>
                <div className="flex flex-wrap gap-2">
                  {rewardTypes.map((reward) => (
                    <button
                      key={reward}
                      type="button"
                      onClick={() => setConfiguredReward(reward)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                        configuredReward === reward
                          ? "bg-[#1f251a] text-[#fffaf0]"
                          : "bg-[#f3ecdc] text-[#675f50] hover:bg-[#efe5d2]"
                      }`}
                    >
                      {reward}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#8a826f]">
                  Affected product
                </p>
                <div className="grid gap-2">
                  {sellerProducts.map((product) => (
                    <button
                      key={product}
                      type="button"
                      onClick={() => setConfiguredProduct(product)}
                      className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                        configuredProduct === product
                          ? "bg-[#f3ecdc] text-[#1f251a] ring-1 ring-[#6f7f4f]/35"
                          : "bg-white/45 text-[#675f50] hover:bg-[#f6efe2]"
                      }`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a826f]">
                    Duration
                  </p>
                  <span className="rounded-full bg-[#efe5d2] px-3 py-1 text-xs font-bold text-[#596540]">
                    {configuredDuration}s
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="15"
                  value={configuredDuration}
                  onChange={(event) =>
                    setConfiguredDuration(Number(event.target.value))
                  }
                  className="w-full accent-[#6f7f4f]"
                />
              </div>

              <div className="rounded-[1.35rem] bg-[#f3ecdc] p-4">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                  Preview
                </p>
                <p className="mt-2 text-sm font-semibold">
                  20k likes unlock {configuredReward.toLowerCase()} on{" "}
                  {configuredProduct} for {configuredDuration} seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
