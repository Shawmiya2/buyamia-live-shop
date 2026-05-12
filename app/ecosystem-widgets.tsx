"use client";

import { useMemo, useState } from "react";

const accountTypes = [
  {
    name: "B2B buyer",
    detail: "RFQs, factory visits, meetings, landed-cost AI.",
    metric: "Procurement mode",
  },
  {
    name: "B2C buyer",
    detail: "Instant checkout, vouchers, rewards, live drops.",
    metric: "Shop mode",
  },
  {
    name: "Seller",
    detail: "Stream scheduling, vouchers, analytics, trust levels.",
    metric: "Seller studio",
  },
  {
    name: "Experience creator",
    detail: "Chef lives, tastings, bookings, restaurant showcases.",
    metric: "Bookings",
  },
];

const sellerTools = [
  ["Paid stream setup", "30 min live package", "QR payment unlocks live controls"],
  ["Delivery methods", "Instant, scheduled, standard", "Gojek and Grab placeholders"],
  ["Free delivery", "After 3 products", "Threshold rules per campaign"],
  ["Vouchers", "VIP and referral coupons", "Limited redemptions per stream"],
  ["Booking lives", "Factory, chef, tasting", "Appointment inventory"],
];

const topSellers = [
  ["Bali Rattan Works", "Platinum verified", "4.9", "42% repeat"],
  ["Java Teak Atelier", "Gold verified", "4.8", "37% repeat"],
  ["Ubud Fiber House", "Silver verified", "4.7", "29% repeat"],
];

const aiActions = [
  ["Stream summary", "Products, objections, questions, and next steps."],
  ["Auto RFQ", "Specs, incoterms, MOQ split, payment terms, documents."],
  ["Negotiation suggestions", "Counter-offers based on quantity and lead time."],
  ["Logistics recommendation", "Instant, scheduled, or container strategy."],
];

const analytics = [
  ["Indonesia", "42%", 76],
  ["Singapore", "24%", 54],
  ["UAE", "18%", 42],
  ["Australia", "16%", 34],
];

const peakMoments = [
  ["08:20", "Stars spike", 64],
  ["14:40", "MOQ question", 88],
  ["21:10", "Checkout burst", 72],
  ["27:30", "Factory visit asks", 58],
];

const arCategories = ["Clothing", "Jewelry", "Makeup", "Head accessories"];

export function EcosystemExpansion() {
  const [accountType, setAccountType] = useState(accountTypes[0].name);
  const [delivery, setDelivery] = useState("Instant delivery");
  const [premiumAi, setPremiumAi] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [sellerTool, setSellerTool] = useState(sellerTools[0][0]);

  const selectedAccount = accountTypes.find((item) => item.name === accountType);
  const coinBonus = newsletter ? "+10% sourcing coins active" : "Standard coin earn rate";

  const selectedSellerTool = useMemo(
    () => sellerTools.find(([name]) => name === sellerTool) ?? sellerTools[0],
    [sellerTool],
  );

  return (
    <>
      <section id="onboarding" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-[#6f7f4f]">
              User types
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
              One onboarding flow, four commerce modes.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#675f50]">
              Buyers, sellers, suppliers, and experience creators start with
              different defaults while keeping the same premium live-commerce
              surface.
            </p>
          </div>
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-xl shadow-[#8a7d61]/8 sm:p-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {accountTypes.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setAccountType(item.name)}
                  className={`rounded-[1.4rem] border p-4 text-left transition ${
                    accountType === item.name
                      ? "border-[#6f7f4f] bg-[#f3ecdc] shadow-sm"
                      : "border-[#ded4c2] bg-white/45 hover:bg-[#f6efe2]"
                  }`}
                >
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="mt-2 block text-xs leading-5 text-[#675f50]">
                    {item.detail}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-[1.4rem] bg-[#1f251a] p-4 text-[#fffaf0]">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                Selected setup
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-2xl font-semibold">{accountType}</p>
                  <p className="mt-1 text-sm text-[#ded7c9]">
                    {selectedAccount?.detail}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#fffaf0]/12 px-3 py-1.5 text-xs font-bold">
                  {selectedAccount?.metric}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="seller-tools" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">
                Seller studio
              </p>
              <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-4xl">
                Live selling tools with procurement-grade trust.
              </h2>
            </div>
            <span className="w-fit rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#596540] shadow-sm">
              Stream duration default: 30 min
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {sellerTools.map(([name]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSellerTool(name)}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                      sellerTool === name
                        ? "bg-[#1f251a] text-[#fffaf0]"
                        : "bg-[#f3ecdc] text-[#675f50] hover:bg-[#efe5d2]"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-[1.5rem] bg-[#f3ecdc] p-5">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                  Active configuration
                </p>
                <h3 className="mt-3 text-2xl font-semibold">
                  {selectedSellerTool[1]}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#675f50]">
                  {selectedSellerTool[2]}
                </p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Book appointment",
                  "Visit factory",
                  "Talk to supplier",
                  "Schedule meeting",
                ].map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="rounded-full border border-[#d6cbb6] bg-white/50 px-4 py-3 text-sm font-bold transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/35"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#cbd8a7]">
                    Top sellers leaderboard
                  </p>
                  <p className="mt-1 text-xs text-[#ded7c9]">
                    Ranking blends revenue, ratings, fulfillment, trust badges,
                    and repeat customers.
                  </p>
                </div>
                <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">
                  Trust score
                </span>
              </div>
              <div className="grid gap-3">
                {topSellers.map(([name, level, rating, repeat], index) => (
                  <div
                    key={name}
                    className="rounded-[1.4rem] border border-white/10 bg-white/[.06] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#cbd8a7]">
                          #{index + 1} {level}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">{name}</h3>
                      </div>
                      <span className="rounded-full bg-[#cbd8a7] px-3 py-1 text-xs font-black text-[#1f251a]">
                        {rating} stars
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#ded7c9]">
                      <span className="rounded-full bg-white/[.08] px-3 py-1">
                        Thumbs up 98%
                      </span>
                      <span className="rounded-full bg-white/[.08] px-3 py-1">
                        {repeat}
                      </span>
                      <span className="rounded-full bg-white/[.08] px-3 py-1">
                        Supplier badge
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ai-native" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              How AI can help buyers and sellers
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
              The copilot becomes the operating system.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {aiActions.map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[1.4rem] border border-[#ded4c2] bg-[#f6efe2] p-4"
                >
                  <p className="font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#675f50]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#e9dfcb] p-5 shadow-sm">
            <div className="rounded-[1.5rem] bg-[#fffaf0] p-5 shadow-xl shadow-[#8a7d61]/8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                    Premium AI assistance
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Advanced insights after free session
                  </h3>
                </div>
                <span className="rounded-full bg-[#1f251a] px-3 py-1 text-xs font-bold text-white">
                  {premiumAi ? "Unlocked" : "$3"}
                </span>
              </div>
              <div className="mt-5 grid gap-2">
                {[
                  "AI session recap",
                  "AI product comparison",
                  "AI negotiation suggestions",
                  "AI meeting assistant",
                ].map((item, index) => (
                  <div
                    key={item}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ${
                      premiumAi || index === 0
                        ? "bg-[#f3ecdc] text-[#1f251a]"
                        : "bg-[#f3ecdc]/55 text-[#8a826f]"
                    }`}
                  >
                    {item}
                    <span className="text-xs">
                      {premiumAi || index === 0 ? "Ready" : "Locked"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPremiumAi(true)}
                  className="rounded-full bg-[#1f251a] px-4 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                >
                  Unlock AI insights
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#6f7f4f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#596540]"
                >
                  Call AI agent
                </button>
              </div>
              <button
                type="button"
                className="mt-2 w-full rounded-full border border-[#d6cbb6] bg-white/45 px-4 py-3 text-sm font-bold transition hover:bg-white"
              >
                Talk with sourcing agent
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="logistics-rewards" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Payments and logistics
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight">
              Checkout adapts to local delivery and global procurement.
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Instant delivery",
                "Standard delivery",
                "Scheduled delivery",
                "Free after 3 products",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDelivery(item)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    delivery === item
                      ? "bg-[#1f251a] text-[#fffaf0]"
                      : "bg-[#f3ecdc] text-[#675f50] hover:bg-[#efe5d2]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-[1.4rem] bg-[#f3ecdc] p-4">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                Delivery estimate
              </p>
              <p className="mt-2 text-2xl font-semibold">{delivery}</p>
              <p className="mt-1 text-sm text-[#675f50]">
                Gojek and Grab delivery integrations are staged as marketplace
                connectors alongside Apple Pay, Stripe, and wire transfer.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Apple Pay", "Stripe", "Wire transfer", "Gojek placeholder", "Grab placeholder"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#efe5d2] px-3 py-1.5 text-xs font-bold text-[#596540]"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
            <p className="text-sm font-semibold text-[#cbd8a7]">
              Rewards engine
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight">
              Coins, stars, VIP tiers, vouchers, and referral loops.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["8,420", "sourcing coins"],
                ["VIP Gold", "early MOQ splits"],
                ["3 vouchers", "loyalty rewards"],
                ["2.4x", "engagement point multiplier"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[.06] p-4"
                >
                  <p className="text-2xl font-semibold text-[#cbd8a7]">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-[#ded7c9]">{label}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setNewsletter((value) => !value)}
              className="mt-5 w-full rounded-full bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#1f251a] transition hover:bg-white"
            >
              {newsletter ? "Newsletter bonus accepted" : "Accept newsletter bonus"}
            </button>
            <p className="mt-3 text-sm font-semibold text-[#cbd8a7]">
              {coinBonus}
            </p>
          </div>
        </div>
      </section>

      <section id="analytics" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-xl shadow-[#8a7d61]/8 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">
                Seller analytics
              </p>
              <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-4xl">
                Engagement, audience, and emotional peaks.
              </h2>
            </div>
            <span className="w-fit rounded-full bg-[#1f251a] px-4 py-2 text-xs font-bold text-[#fffaf0]">
              Premium analytics UI
            </span>
          </div>
          <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
            <div className="grid gap-3">
              {analytics.map(([country, value, width]) => (
                <div key={country} className="rounded-[1.2rem] bg-[#f3ecdc] p-4">
                  <div className="mb-2 flex justify-between text-sm font-semibold">
                    <span>{country}</span>
                    <span>{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#ded4c2]">
                    <div
                      className="h-2 rounded-full bg-[#6f7f4f]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 text-center">
                {["25-34 age", "58% female", "91 engagement"].map((item) => (
                  <span
                    key={item}
                    className="rounded-2xl bg-[#efe5d2] px-2 py-3 text-xs font-bold text-[#596540]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-[#f3ecdc] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Emotion timeline</p>
                <p className="text-xs font-bold text-[#6f7f4f]">
                  Best product: Rattan lounge chair
                </p>
              </div>
              <div className="flex h-56 items-end gap-3">
                {peakMoments.map(([time, label, height]) => (
                  <div key={time} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-2xl bg-[#6f7f4f]"
                      style={{ height: `${height}%` }}
                    />
                    <p className="text-xs font-bold">{time}</p>
                    <p className="text-center text-[11px] leading-4 text-[#675f50]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="future-commerce" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#e9dfcb] p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Fashion and beauty AR
            </p>
            <h2 className="mt-3 max-w-3xl font-serif text-2xl leading-tight sm:text-4xl">
              Try product live with AI filter.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#675f50]">
              Conceptual support for clothing, jewelry, makeup, and head
              accessories without changing the current commerce flow.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {arCategories.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] bg-[#fffaf0]/80 p-4 shadow-sm"
                >
                  <p className="font-semibold">{item}</p>
                  <p className="mt-1 text-xs text-[#675f50]">
                    AI filter preview ready
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
