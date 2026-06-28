import Link from "next/link";
import Image from "next/image";
import { BusinessLiveSuite } from "../business-live-suite";
import { CurrencyEstimatePanel } from "./currency-estimate-panel";
import { CheckoutControls, LiveHeroActions } from "./live-room-controls";
import { EngagementDiscountPanel } from "./engagement-discount";
import { getLives } from "@/lib/backend/live-service";
import type { LiveEvent } from "@/lib/backend/types";

type Product = {
  name: string;
  supplier: string;
  price: string;
  moq: string;
  image: string;
};

const products: Product[] = [
  {
    name: "Rattan lounge chair",
    supplier: "Bali Rattan Works",
    price: "$68/unit",
    moq: "MOQ 24",
    image:
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=86",
  },
  {
    name: "Outdoor daybed",
    supplier: "Bali Rattan Works",
    price: "$124/unit",
    moq: "MOQ 12",
    image:
      "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=800&q=86",
  },
  {
    name: "Teak side table",
    supplier: "Java Teak Atelier",
    price: "$42/unit",
    moq: "MOQ 30",
    image:
      "https://images.unsplash.com/photo-1532372320978-9d97acb7f8c9?auto=format&fit=crop&w=800&q=86",
  },
];

const chat = [
  ["Maya", "Can you split MOQ across daybed and lounge chairs?"],
  ["Supplier", "Bisa. Mixed container MOQ is 36 units."],
  ["Buyamia AI", "Translated and added to RFQ draft."],
  ["Villa Group", "Request CIF Bali with cushion options."],
];

const buyerAvatars = ["AV", "BC", "NR"];

const liveReactions = ["+", "♥", "★"];

const liveSignals = [
  "18 people bought this",
  "Trending product",
  "Most viewed live",
];

const emotionPeaks = [
  ["04:12", "hearts", 42],
  ["12:48", "stars", 78],
  ["19:30", "RFQ asks", 92],
  ["26:10", "checkout", 68],
];

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; q?: string }>;
}) {
  const filters = await searchParams;
  const lives = await getLives();
  const filteredLives = filterLives(lives, filters);
  const scheduledLives = lives
    .filter((live) => live.status === "scheduled")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3ecdc] text-[#1f251a]">
      <style>{`
        @keyframes ambientFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -12px, 0); }
        }

        @keyframes reactionRise {
          0% { opacity: 0; transform: translateY(28px) scale(.86); }
          18%, 72% { opacity: .92; }
          100% { opacity: 0; transform: translateY(-132px) scale(1.08); }
        }

        @keyframes softScan {
          0% { transform: translateX(-100%); opacity: 0; }
          20%, 82% { opacity: .38; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes messageIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(184, 84, 56, .34); }
          50% { box-shadow: 0 0 0 10px rgba(184, 84, 56, 0); }
        }

        @keyframes softLift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes viewerCycle {
          0%, 44% { transform: translateY(0); opacity: 1; }
          50%, 94% { transform: translateY(-18px); opacity: 1; }
          100% { transform: translateY(-36px); opacity: 0; }
        }

        @keyframes tinyRise {
          0% { opacity: 0; transform: translateY(16px) scale(.92); }
          18%, 72% { opacity: .72; }
          100% { opacity: 0; transform: translateY(-84px) scale(1.04); }
        }

        @keyframes quietToast {
          0%, 100% { opacity: 0; transform: translateY(-8px); }
          16%, 78% { opacity: 1; transform: translateY(0); }
        }

        @keyframes thinking {
          0%, 80%, 100% { opacity: .28; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }

        @keyframes pinGlow {
          0%, 100% { box-shadow: 0 18px 45px rgba(138,125,97,.08); }
          50% { box-shadow: 0 22px 54px rgba(111,127,79,.14); }
        }

        @keyframes countdownBreath {
          0%, 100% { background-color: rgba(239,229,210,.95); }
          50% { background-color: rgba(213,202,180,.72); }
        }

        .beige-aurora {
          background-image:
            radial-gradient(circle at 18% 16%, rgba(111, 127, 79, .2), transparent 30%),
            radial-gradient(circle at 84% 4%, rgba(184, 84, 56, .12), transparent 28%),
            linear-gradient(135deg, rgba(255,250,240,.8), rgba(255,250,240,0));
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .001ms !important;
          }
        }
      `}</style>

      <section className="relative p-3 sm:p-4 lg:p-5">
        <div className="beige-aurora pointer-events-none absolute inset-0" />

        <div className="relative min-h-[88svh] overflow-hidden rounded-[1.7rem] bg-[#1f251a] shadow-2xl shadow-[#8a7d61]/18 sm:min-h-[84svh] lg:min-h-[86svh] lg:rounded-[2.2rem]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(31,37,26,.1), rgba(31,37,26,.04) 34%, rgba(31,37,26,.38) 62%, rgba(31,37,26,.92)), url(https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=90)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-[#fffaf0]/80 [animation:softScan_4.2s_ease-in-out_infinite]" />

          <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-3 sm:p-5">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full bg-[#fffaf0]/78 py-2 pl-2 pr-4 shadow-lg shadow-black/10 backdrop-blur-2xl"
            >
              <Image
                src="/buyamia-logo.svg"
                alt="Buyamia logo"
                width={36}
                height={36}
                className="size-9 rounded-full shadow-sm"
                priority
              />
              <span>
                <span className="block text-sm font-semibold text-[#1f251a]">
                  Buyamia
                </span>
                <span className="hidden text-xs text-[#706858] sm:block">
                  Live sourcing
                </span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 rounded-full bg-[#fffaf0]/70 p-1 shadow-lg shadow-black/10 backdrop-blur-2xl lg:flex">
              {["AI sourcing", "Schedule stream", "Become a seller"].map(
                (item) => (
                  <a
                    key={item}
                    href={
                      item === "AI sourcing"
                        ? "/ai-sourcing"
                        : item === "Schedule stream"
                          ? "/live/schedule"
                          : "/become-a-seller"
                    }
                    className="rounded-full px-4 py-2 text-xs font-bold text-[#5f584b] transition hover:bg-white/70 hover:text-[#1f251a]"
                  >
                    {item}
                  </a>
                ),
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#b85438] px-3 py-1.5 text-xs font-black text-white [animation:livePulse_2s_ease-in-out_infinite]">
                <span className="size-1.5 rounded-full bg-white" />
                LIVE
              </span>
              <span className="hidden h-[30px] overflow-hidden rounded-full bg-[#fffaf0]/78 px-3 py-1.5 text-xs font-bold text-[#1f251a] shadow-lg shadow-black/10 backdrop-blur-2xl sm:inline-flex">
                <span className="flex flex-col [animation:viewerCycle_7s_ease-in-out_infinite]">
                  <span>2,418 viewers</span>
                  <span>2,421 viewers</span>
                  <span>2,418 viewers</span>
                </span>
              </span>
              <BuyerAvatars />
              <div className="hidden items-center gap-1 rounded-full bg-[#fffaf0]/70 p-1 shadow-lg shadow-black/10 backdrop-blur-2xl md:flex">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-xs font-bold text-[#5f584b] transition hover:bg-white/70 hover:text-[#1f251a]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[#1f251a] px-4 py-2 text-xs font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                >
                  Register
                </Link>
              </div>
            </div>
          </nav>

          <LiveOrderToast />
          <SubtleReactions />
          <LiveSignalStack />

          <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <p className="mb-4 text-sm font-semibold text-[#e8ddc8]">
                  Live from Bali
                </p>
                <h1 className="max-w-3xl font-serif text-2xl leading-[1.08] text-[#fffaf0] sm:text-4xl lg:text-5xl">
                  Resort rattan collection, sourced live from Bali.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#eee5d4]">
                  Watch finish quality, cushion options, export packing, and
                  mixed-container pricing while Buyamia AI prepares the RFQ in
                  real time.
                </p>
                <LiveHeroActions />
              </div>

              <AIOverlay />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div />
              <LiveChatOverlay />
            </div>
          </div>
        </div>
      </section>

      <LiveDatabaseCatalog lives={filteredLives} filters={filters} />

      <EngagementDiscountPanel />

      <BusinessLiveSuite />

      <section id="ai" className="px-5 py-16 sm:px-7 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Progressive procurement intelligence
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
              The buying layer appears only when it helps.
            </h2>
          </div>

          <div className="mt-9 grid gap-6 lg:grid-cols-3">
            {[
              [
                "AI sourcing copilot",
                "Translates supplier speech, extracts specs, and recommends the next procurement action.",
              ],
              [
                "MOQ and RFQ assistant",
                "Models mixed containers, split orders, lead time, and quote readiness without cluttering the stream.",
              ],
              [
                "Supplier confidence",
                "Verification, export readiness, and hospitality references stay lightweight but visible.",
              ],
            ].map(([title, body]) => (
              <article key={title} className="max-w-sm">
                <div className="mb-5 h-px w-16 bg-[#6f7f4f]/45" />
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#675f50]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LiveAnalyticsStrip />

      <section className="px-5 pb-16 sm:px-7 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">
                Wholesale access
              </p>
              <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
                Pinned products from the live room.
              </h2>
            </div>
            <Link href="/dashboard/supplier" className="w-full rounded-full bg-[#1f251a] px-4 py-2.5 text-center text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1f251a]/25 sm:w-fit">
              Request stream RFQ
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {products.map((product, index) => (
              <article
                key={product.name}
                className="group overflow-hidden rounded-[2rem] bg-[#fffaf0] shadow-xl shadow-[#8a7d61]/8 transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#8a7d61]/14"
                style={{
                  animation:
                    index === 0
                      ? "pinGlow 6s ease-in-out infinite"
                      : undefined,
                }}
              >
                <div
                  className="relative h-64 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${product.image})` }}
                >
                  {index === 0 && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#fffaf0]/82 px-3 py-1 text-xs font-bold text-[#596540] shadow-lg backdrop-blur-xl">
                      Live pinned
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6f7f4f]">
                    {product.moq}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#675f50]">
                    {product.supplier}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xl font-semibold">{product.price}</p>
                    <Link href="/dashboard/supplier" className="rounded-full bg-[#6f7f4f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/35">
                      RFQ
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <InstantCheckoutModal />

      <section id="seller" className="px-5 pb-14 sm:px-7 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Sourcing coins and VIP rewards
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
              A live commerce reward system for serious buyers.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#675f50]">
              Earn sourcing coins for live attendance, RFQs, verified orders,
              and supplier reviews. VIP buyers unlock early MOQ splits, private
              quote rooms, and concierge procurement support.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["8,420 coins", "VIP Gold", "Private quote room"].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#fffaf0]/76 px-3.5 py-2 text-sm font-bold shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="schedule" className="px-5 pb-18 sm:px-7 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">
                Upcoming live streams
              </p>
              <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
                Minimal sourcing rooms, scheduled with intent.
              </h2>
            </div>
            <Link href="/live/calendar" className="w-full rounded-full bg-[#1f251a] px-4 py-2.5 text-center text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1f251a]/25 sm:w-fit">
              View calendar
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {scheduledLives.length ? scheduledLives.slice(0, 3).map((live) => {
              const startsAt = new Date(live.startsAt);

              return (
              <article
                key={live.id}
                className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0]/84 p-4 shadow-sm backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#6f7f4f]">
                      {formatScheduleDate(startsAt)} - {formatScheduleTime(startsAt)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">
                      {live.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#675f50]">
                      {live.providerName}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#efe5d2] px-3 py-1.5 text-xs font-black text-[#596540]">
                    {formatCountdown(startsAt)}
                  </span>
                </div>
                <Link href={`/live/${live.id}`} className="mt-4 inline-flex rounded-full border border-[#cabda4] bg-[#f3ecdc] px-4 py-2 text-sm font-bold text-[#1f251a]">
                  View details
                </Link>
              </article>
              );
            }) : (
              <p className="rounded-2xl bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50]">
                No scheduled live streams are available yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function LiveDatabaseCatalog({
  lives,
  filters,
}: {
  lives: LiveEvent[];
  filters: { category?: string; status?: string; q?: string };
}) {
  const hasFilters = Boolean(filters.category || filters.status || filters.q);
  const previewLives = lives.slice(0, 4);

  return (
    <section className="px-5 pb-14 sm:px-7 lg:px-8" aria-labelledby="live-catalog-heading">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6f7f4f]">Live catalogue</p>
            <h2 id="live-catalog-heading" className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
              Stored live streams and replays
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Rooms", "Hotels", "Spa", "Food & Brunch", "Facilities", "Beach Side", "Services", "Experiences", "Offers"].map((category) => (
              <Link
                key={category}
                href={`/live?category=${encodeURIComponent(category)}`}
                className="rounded-full bg-[#f3ecdc] px-3 py-2 text-xs font-bold text-[#596540]"
              >
                {category}
              </Link>
            ))}
            {hasFilters && (
              <Link href="/live" className="rounded-full bg-[#1f251a] px-3 py-2 text-xs font-bold text-[#fffaf0]">
                Clear filters
              </Link>
            )}
            <Link href={catalogueHref(filters)} className="rounded-full bg-[#1f251a] px-3 py-2 text-xs font-bold text-[#fffaf0]">
              Browse All Lives
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {previewLives.length ? (
            previewLives.map((live) => (
              <article key={live.id} className="rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{live.category}</p>
                    <h3 className="mt-2 text-lg font-semibold">{live.title}</h3>
                    <p className="mt-1 text-sm text-[#675f50]">{live.providerName}</p>
                  </div>
                  <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#596540]">
                    {live.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#1f251a] px-3 py-1 text-xs font-black text-[#fffaf0]">
                    Trust {live.trustScore.score}
                  </span>
                  {live.isPinned && (
                    <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
                      {live.pinReason?.replace(/_/g, " ")}
                    </span>
                  )}
                  <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#596540]">
                    Replay {live.replay.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/live/${live.id}`} className="rounded-full bg-[#1f251a] px-4 py-2.5 text-sm font-bold text-[#fffaf0]">
                    {live.status === "replay" ? "View replay" : "Watch live"}
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
              No live streams match these filters. Clear filters or choose another category.
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-center">
          <Link href={catalogueHref(filters)} className="rounded-full bg-[#1f251a] px-6 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]">
            View Full Catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}

function catalogueHref(filters: { category?: string; status?: string; q?: string }) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("search", filters.q);
  const query = params.toString();
  return query ? `/live/catalogue?${query}` : "/live/catalogue";
}

function filterLives(lives: LiveEvent[], filters: { category?: string; status?: string; q?: string }) {
  const category = filters.category?.toLowerCase();
  const status = filters.status?.toLowerCase();
  const query = filters.q?.toLowerCase();

  return lives.filter((live) => {
    const categoryMatches =
      !category ||
      live.category.toLowerCase() === category ||
      live.providerRole.toLowerCase().includes(category.replace(/s$/, ""));
    const statusMatches =
      !status ||
      live.status === status ||
      (status === "live_now" && live.status === "live") ||
      (status === "replays" && live.status === "replay") ||
      (status === "pinned" && live.isPinned);
    const queryMatches =
      !query ||
      live.title.toLowerCase().includes(query) ||
      live.providerName.toLowerCase().includes(query);

    return categoryMatches && statusMatches && queryMatches;
  });
}

function formatScheduleDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatScheduleTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatCountdown(value: Date) {
  const diff = value.getTime() - Date.now();
  if (diff <= 0) {
    return "Soon";
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function AIOverlay() {
  return (
    <aside className="hidden rounded-[1.5rem] bg-[#fffaf0]/76 p-4 shadow-2xl shadow-black/10 backdrop-blur-2xl lg:block">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1f251a]">
            Buyamia AI copilot
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#675f50]">
            RFQ draft in progress
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="size-1 rounded-full bg-[#6f7f4f]"
                  style={{
                    animation: `thinking 1.4s ease-in-out ${dot * 0.18}s infinite`,
                  }}
                />
              ))}
            </span>
          </p>
        </div>
        <span className="rounded-full bg-[#1f251a] px-3 py-1 text-xs font-bold text-white">
          LIVE
        </span>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-[#5f584b]">
        <p>
          Translation captured. Supplier accepts mixed-container MOQ across
          chair, daybed, and side table.
        </p>
        <div className="h-px bg-[#d8cdb8]" />
        <p>
          Recommendation: request CIF Bali, outdoor finish sample, and cushion
          fabric lead-time confirmation.
        </p>
        <div className="h-px bg-[#d8cdb8]" />
        <p>
          Session recap: 3 products discussed, 18 buyers saved the chair, 7 RFQs
          likely after the stream.
        </p>
      </div>
    </aside>
  );
}

function LiveAnalyticsStrip() {
  return (
    <section className="px-5 pb-16 sm:px-7 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">
            Live product stack
          </p>
          <h2 className="mt-2 font-serif text-2xl leading-tight">
            Pinned products, comments, checkout, and RFQ stay in one room.
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              ["Rattan lounge chair", "$68/unit", "Instant RFQ"],
              ["Outdoor daybed", "$124/unit", "Apple Pay ready"],
              ["Teak side table", "$42/unit", "Free delivery after 3"],
            ].map(([name, price, action]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 rounded-[1.4rem] bg-[#f3ecdc] p-4"
              >
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="mt-1 text-xs text-[#675f50]">{price}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#1f251a] px-3 py-1.5 text-xs font-bold text-[#fffaf0]">
                  {action}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#cbd8a7]">
                Emotion tracking timeline
              </p>
              <p className="mt-1 text-xs text-[#ded7c9]">
                Seller analytics highlights reaction peaks during the stream.
              </p>
            </div>
            <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">
              Premium
            </span>
          </div>
          <div className="flex h-56 items-end gap-3 rounded-[1.5rem] bg-white/[.06] p-4">
            {emotionPeaks.map(([time, label, height]) => (
              <div key={time} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-2xl bg-[#cbd8a7]"
                  style={{ height: `${height}%` }}
                />
                <p className="text-xs font-bold">{time}</p>
                <p className="text-center text-[11px] leading-4 text-[#ded7c9]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InstantCheckoutModal() {
  return (
    <section className="px-5 pb-16 sm:px-7 lg:px-8 lg:pb-20">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-[#6f7f4f]">
            Instant live procurement
          </p>
          <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
            A premium checkout flow for buyers ready to move.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#675f50]">
            Convert live sourcing intent into a secure Buy Now order, formal
            RFQ, or wire-ready procurement package with delivery scheduling
            built in.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-[#6f7f4f]/10 blur-3xl" />
          <div
            role="dialog"
            aria-label="Instant checkout"
            className="relative overflow-hidden rounded-[1.9rem] bg-[#fffaf0]/88 p-5 shadow-2xl shadow-[#8a7d61]/14 backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6f7f4f]">
                  Secure checkout
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  Rattan lounge chair
                </h3>
                <p className="mt-2 text-sm text-[#675f50]">
                  Bali Rattan Works - MOQ 24 - CIF Bali available
                </p>
              </div>
              <div className="w-fit rounded-2xl bg-[#efe5d2] px-4 py-3 text-left sm:text-right">
                <p className="text-xs text-[#675f50]">Source price</p>
                <p className="text-xl font-semibold">IDR 1,080,000/unit</p>
                <p className="mt-1 text-xs text-[#675f50]">Fixed IDR source price</p>
              </div>
            </div>

            <CheckoutControls />

            <CurrencyEstimatePanel
              title="Checkout and landed cost estimate"
              summaryLabel="Estimate uses the buyer-selected currency and a fixed source-rate snapshot."
              sourceLabel="Rattan lounge chair"
              sourcePriceIdr={1080000}
              quantity={24}
            />

            <div className="mt-5 rounded-3xl bg-[#1f251a] p-4 text-[#fffaf0]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Delivery scheduling</p>
                  <p className="mt-1 text-xs text-[#ded7c9]">
                    Reserve production window and delivery date.
                  </p>
                </div>
                <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">
                  Jun 12-18
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["SSL secured", "Verified supplier", "Escrow available"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-[#efe5d2] px-3 py-1.5 text-xs font-bold text-[#596540]"
                  >
                    {badge}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveChatOverlay() {
  return (
    <div className="max-h-32 overflow-hidden rounded-[1.5rem] bg-[#fffaf0]/64 p-3.5 shadow-2xl shadow-black/10 backdrop-blur-2xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
          Live comments
        </p>
        <span className="text-xs font-bold text-[#675f50]">AI translated</span>
      </div>
      <div className="space-y-2">
        {chat.slice(0, 3).map(([name, message], index) => (
          <div
            key={`${name}-${message}`}
            className="text-sm leading-6"
            style={{ animation: `messageIn .48s ease-out ${index * 0.08}s both` }}
          >
            <span className="font-semibold text-[#596540]">{name}</span>
            <span className="ml-2 text-[#4f493e]">{message}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-[#675f50]">
          Supplier typing
          <span className="inline-flex gap-1">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-1 rounded-full bg-[#6f7f4f]"
                style={{
                  animation: `thinking 1.3s ease-in-out ${dot * 0.16}s infinite`,
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

function BuyerAvatars() {
  return (
    <div className="hidden -space-x-2 md:flex">
      {buyerAvatars.map((buyer, index) => (
        <span
          key={buyer}
          className="grid size-7 place-items-center rounded-full border border-[#fffaf0]/70 bg-[#6f7f4f] text-[10px] font-black text-[#fffaf0] shadow-lg shadow-black/10"
          style={{
            animation: `messageIn .5s ease-out ${index * 0.16}s both`,
          }}
        >
          {buyer}
        </span>
      ))}
    </div>
  );
}

function LiveOrderToast() {
  return (
    <div className="absolute left-1/2 top-24 z-20 hidden -translate-x-1/2 rounded-full bg-[#fffaf0]/68 px-4 py-2 text-xs font-bold text-[#1f251a] shadow-2xl shadow-black/10 backdrop-blur-2xl md:block [animation:quietToast_8s_ease-in-out_infinite]">
      Aman Villas requested a live RFQ
    </div>
  );
}

function LiveSignalStack() {
  return (
    <div className="pointer-events-none absolute left-4 top-24 z-20 hidden max-w-[220px] flex-col gap-2 sm:flex lg:left-8">
      {liveSignals.map((signal, index) => (
        <div
          key={signal}
          className="w-fit rounded-full bg-[#fffaf0]/72 px-3 py-2 text-xs font-bold text-[#1f251a] shadow-2xl shadow-black/10 backdrop-blur-2xl"
          style={{
            animation: `quietToast ${7 + index * 0.7}s ease-in-out ${index * 0.8}s infinite`,
          }}
        >
          {signal}
        </div>
      ))}
    </div>
  );
}

function SubtleReactions() {
  return (
    <div className="pointer-events-none absolute bottom-28 right-5 z-20 hidden h-36 w-14 sm:block">
      {liveReactions.map((reaction, index) => (
        <span
          key={`${reaction}-${index}`}
          className="absolute bottom-0 grid size-8 place-items-center rounded-full bg-[#fffaf0]/58 text-xs font-black text-[#596540] shadow-xl shadow-black/10 backdrop-blur-2xl"
          style={{
            right: `${(index % 2) * 12}px`,
            animation: `tinyRise ${4 + index * 0.5}s ease-in-out ${index * 0.7}s infinite`,
          }}
        >
          {reaction}
        </span>
      ))}
    </div>
  );
}
