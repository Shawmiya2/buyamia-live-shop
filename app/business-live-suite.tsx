"use client";

import { useEffect, useMemo, useState } from "react";

type BusinessCategory = {
  name: string;
  title: string;
  venue: string;
  reviewer: string;
  proof: string;
  audience: string;
  image: string;
  tags: string[];
};

type ScheduledLive = {
  date: string;
  time: string;
  title: string;
  host: string;
  mode: string;
  reviewers: string;
};

const businessCategories: BusinessCategory[] = [
  {
    name: "Hotels",
    title: "Suite walkthrough with guest Q&A",
    venue: "Canggu boutique resort",
    reviewer: "Verified guest review live",
    proof: "Stayed Mar 2026",
    audience: "1,820 watching",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1100&q=86",
    tags: ["Room tour", "Hotel references", "Book stay"],
  },
  {
    name: "Spas",
    title: "Treatment room inspection and service feedback",
    venue: "Uluwatu wellness spa",
    reviewer: "Real customer feedback",
    proof: "Booked via Buyamia",
    audience: "740 watching",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1100&q=86",
    tags: ["Service proof", "Reserve slot", "Wellness"],
  },
  {
    name: "Restaurants",
    title: "Chef table live review and kitchen pass",
    venue: "Seminyak supper club",
    reviewer: "Verified diner review",
    proof: "Receipt linked",
    audience: "2,460 watching",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1100&q=86",
    tags: ["Order live", "Reserve table", "Chef stream"],
  },
  {
    name: "Cafes",
    title: "Coffee tasting and brunch crowd feedback",
    venue: "Ubud garden cafe",
    reviewer: "Repeat customer review",
    proof: "3 visits verified",
    audience: "920 watching",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1100&q=86",
    tags: ["Cafe discovery", "Order now", "Loyalty"],
  },
  {
    name: "Travel experiences",
    title: "Private island route with live guest feedback",
    venue: "Komodo experience studio",
    reviewer: "Traveler review live",
    proof: "Completed trip",
    audience: "1,120 watching",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1100&q=86",
    tags: ["Book experience", "Guide verified", "Group quote"],
  },
];

const scheduledLives: ScheduledLive[] = [
  {
    date: "May 14",
    time: "10:30",
    title: "Chef tasting and honest diner reviews",
    host: "Seminyak supper club",
    mode: "Restaurant live",
    reviewers: "8 verified diners invited",
  },
  {
    date: "May 15",
    time: "15:00",
    title: "Hotel suite tour with guest references",
    host: "Canggu boutique resort",
    mode: "Hotel live",
    reviewers: "12 prior guests invited",
  },
  {
    date: "May 16",
    time: "18:45",
    title: "Spa treatment room and therapist Q&A",
    host: "Uluwatu wellness spa",
    mode: "Spa live",
    reviewers: "5 booked customers invited",
  },
];

const invitePlatforms = ["LinkedIn", "WhatsApp", "X", "Email"];

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function inviteHref(platform: string, link: string, title: string) {
  const encodedLink = encodeURIComponent(link);
  const encodedText = encodeURIComponent(
    `${title} - join the Buyamia live session now`,
  );

  if (platform === "LinkedIn") {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`;
  }

  if (platform === "WhatsApp") {
    return `https://wa.me/?text=${encodedText}%20${encodedLink}`;
  }

  if (platform === "X") {
    return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`;
  }

  return `mailto:?subject=${encodedText}&body=${encodedText}%0A${encodedLink}`;
}

export function BusinessLiveSuite() {
  const [categoryName, setCategoryName] = useState(businessCategories[0].name);
  const [selectedLive, setSelectedLive] = useState(scheduledLives[0]);
  const [copied, setCopied] = useState(false);
  const [freeSeconds, setFreeSeconds] = useState(30 * 60);
  const [isWatching, setIsWatching] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paidExtension, setPaidExtension] = useState(false);

  const selectedCategory = useMemo(
    () =>
      businessCategories.find((category) => category.name === categoryName) ??
      businessCategories[0],
    [categoryName],
  );

  const liveLink =
  "/live?session=" +
  encodeURIComponent(
    selectedLive.mode.toLowerCase().replace(/\s+/g, "-"),
  );

  useEffect(() => {
    if (!isWatching || showPayment || paidExtension) {
      return;
    }

    const timer = window.setInterval(() => {
      setFreeSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          setShowPayment(true);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isWatching, paidExtension, showPayment]);

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(liveLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function startFreeAccess() {
    setIsWatching(true);
    setShowPayment(false);
    setPaidExtension(false);
    setFreeSeconds(30 * 60);
  }

  function unlockExtension() {
    setPaidExtension(true);
    setShowPayment(false);
    setFreeSeconds(30 * 60);
  }

  return (
    <section id="business-live" className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Business Live network
            </p>
            <h2 className="mt-2 max-w-4xl font-serif text-2xl leading-tight sm:text-4xl">
              Invite buyers, schedule premium lives, and let real customers
              review places live.
            </h2>
          </div>
          <span className="w-fit rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#596540] shadow-sm">
            First 30 min free
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] shadow-xl shadow-[#8a7d61]/8">
            <div
              className="relative min-h-[440px] bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(31,37,26,.04), rgba(31,37,26,.2) 40%, rgba(31,37,26,.86)), url(${selectedCategory.image})`,
              }}
            >
              <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
                {businessCategories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setCategoryName(category.name)}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold shadow-lg backdrop-blur-xl transition ${
                      categoryName === category.name
                        ? "bg-[#fffaf0] text-[#1f251a]"
                        : "bg-[#fffaf0]/62 text-[#4f493e] hover:bg-[#fffaf0]/84"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="absolute right-4 top-20 rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white shadow-lg">
                LIVE REVIEW
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold text-[#f8edda]">
                    {selectedCategory.venue} - {selectedCategory.audience}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-tight text-white sm:text-3xl">
                    {selectedCategory.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedCategory.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#fffaf0]/90 px-3 py-1.5 text-xs font-bold text-[#1f251a]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 rounded-[1.4rem] border border-white/18 bg-[#fffaf0]/88 p-4 text-[#1f251a] shadow-xl backdrop-blur-xl sm:max-w-md">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                      Review authenticity
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {selectedCategory.reviewer}
                    </p>
                    <p className="mt-1 text-xs text-[#675f50]">
                      {selectedCategory.proof}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#6f7f4f]">
                    Social invitations
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Send a direct join link to business audiences.
                  </h3>
                </div>
                <span className="rounded-full bg-[#efe5d2] px-3 py-1.5 text-xs font-bold text-[#596540]">
                  Instant join
                </span>
              </div>

              <div className="mt-4 rounded-[1.4rem] bg-[#f3ecdc] p-4">
                <p className="break-all text-xs font-semibold text-[#675f50]">
                  {liveLink}
                </p>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {invitePlatforms.map((platform) => (
                  <a
                    key={platform}
                    href={inviteHref(platform, liveLink, selectedLive.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#d6cbb6] bg-white/50 px-4 py-3 text-center text-sm font-bold transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/35"
                  >
                    Share to {platform}
                  </a>
                ))}
              </div>

              <button
                type="button"
                onClick={copyInviteLink}
                className="mt-3 w-full rounded-full bg-[#1f251a] px-4 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1f251a]/25"
              >
                {copied ? "Link copied" : "Copy direct live link"}
              </button>
            </div>

            <div className="relative rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#cbd8a7]">
                    Live calendar and access
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Schedule, invite, watch free, then extend.
                  </h3>
                </div>
                <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1.5 text-xs font-bold">
                  +30 min $5
                </span>
              </div>

              <div className="mt-5 grid gap-2">
                {scheduledLives.map((live) => (
                  <button
                    key={`${live.date}-${live.time}`}
                    type="button"
                    onClick={() => {
                      setSelectedLive(live);
                      setIsWatching(false);
                      setShowPayment(false);
                      setPaidExtension(false);
                      setFreeSeconds(30 * 60);
                    }}
                    className={`rounded-[1.35rem] border p-4 text-left transition ${
                      selectedLive.title === live.title
                        ? "border-[#cbd8a7] bg-white/[.12]"
                        : "border-white/10 bg-white/[.06] hover:bg-white/[.1]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#cbd8a7]">
                          {live.date} - {live.time} - {live.mode}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {live.title}
                        </p>
                        <p className="mt-1 text-xs text-[#ded7c9]">
                          {live.host}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#fffaf0]/10 px-3 py-1 text-[11px] font-bold text-[#ded7c9]">
                        {live.reviewers}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-[1.4rem] bg-[#fffaf0]/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                      Viewer access timer
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      {formatCountdown(freeSeconds)}
                    </p>
                    <p className="mt-1 text-xs text-[#ded7c9]">
                      Free access expires after 30 minutes.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:min-w-44">
                    <button
                      type="button"
                      onClick={startFreeAccess}
                      className="rounded-full bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#1f251a] transition hover:bg-white"
                    >
                      Start free access
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWatching(true);
                        setFreeSeconds(5);
                        setShowPayment(false);
                      }}
                      className="rounded-full border border-white/14 bg-white/[.08] px-4 py-3 text-xs font-bold text-[#fffaf0] transition hover:bg-white/[.12]"
                    >
                      Preview expiry
                    </button>
                  </div>
                </div>
              </div>

              {showPayment && (
                <div
                  role="dialog"
                  aria-label="Continue watching payment"
                  className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-[#d6cbb6] bg-[#fffaf0] p-4 text-[#1f251a] shadow-2xl shadow-black/18"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                        Free session ended
                      </p>
                      <h4 className="mt-2 text-xl font-semibold">
                        Continue watching for $5.
                      </h4>
                      <p className="mt-1 text-sm text-[#675f50]">
                        Unlock 30 extra minutes with Apple Pay, Stripe, or wire
                        transfer.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={unlockExtension}
                      className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                    >
                      Pay $5
                    </button>
                  </div>
                </div>
              )}

              {paidExtension && (
                <p className="mt-3 rounded-full bg-[#cbd8a7] px-4 py-2 text-center text-xs font-black text-[#1f251a]">
                  Extra 30 minutes unlocked
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
