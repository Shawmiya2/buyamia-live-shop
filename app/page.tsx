import Image from "next/image";
import { EcosystemExpansion } from "./ecosystem-widgets";
import { HotelLiveAccess } from "./hotel-live-access";
import { ProcurementOSSections } from "./procurement-os-sections";
import { SellerPaymentConsole } from "./seller-payment-console";

type Stream = {
  supplier: string;
  region: string;
  title: string;
  viewers: string;
  moq: string;
  price: string;
  verified: string;
  image: string;
  tags: string[];
};

type Product = {
  name: string;
  supplier: string;
  price: string;
  moq: string;
  image: string;
};

const streams: Stream[] = [
  {
    supplier: "Bali Rattan Works",
    region: "Gianyar, Bali",
    title: "Resort lounge collection live sourcing",
    viewers: "84 buyers",
    moq: "MOQ 24",
    price: "from $68/unit",
    verified: "SVLK verified",
    image:
      "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=1100&q=85",
    tags: ["Outdoor grade", "Custom finish", "Villa projects"],
  },
  {
    supplier: "Java Teak Atelier",
    region: "Jepara, Central Java",
    title: "Contract teak dining and bedroom sets",
    viewers: "62 buyers",
    moq: "MOQ 12",
    price: "from $112/unit",
    verified: "FSC source",
    image:
      "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=1100&q=85",
    tags: ["Hospitality spec", "Container quote", "Batch QC"],
  },
  {
    supplier: "Lombok Stone Studio",
    region: "Lombok",
    title: "Stone basins and spa fixtures drop",
    viewers: "47 buyers",
    moq: "MOQ 18",
    price: "from $86/unit",
    verified: "Trade license",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=85",
    tags: ["Export packing", "Natural stone", "Suite ready"],
  },
];

const products: Product[] = [
  {
    name: "Handwoven lounge chair",
    supplier: "Bali Rattan Works",
    price: "$68",
    moq: "24 units",
    image:
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Teak console table",
    supplier: "Java Teak Atelier",
    price: "$112",
    moq: "16 units",
    image:
      "https://images.unsplash.com/photo-1532372320978-9d97acb7f8c9?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Stone vanity basin",
    supplier: "Lombok Stone Studio",
    price: "$86",
    moq: "18 pieces",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Woven pendant lamp",
    supplier: "Ubud Fiber House",
    price: "$34",
    moq: "40 units",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=85",
  },
];

const procurementSignals = [
  ["RFQ heat", "142 active quotes"],
  ["Avg reply", "17 minutes"],
  ["Cost delta", "-12% vs brief"],
  ["Verified", "2.1K suppliers"],
];

const platformFlow = [
  ["01", "Discover live", "Watch suppliers, chefs, hotels, and overstock streams."],
  ["02", "Verify trust", "Read audit scores, documents, references, and reviews."],
  ["03", "Automate RFQ", "Let AI structure specs, MOQ, landed cost, and risk."],
  ["04", "Transact safely", "Use escrow, contracts, scheduling, and protected payment."],
];

const chatFeed = [
  ["Buyer", "Can you ship CIF Bali for 42 villas?"],
  ["Supplier", "Yes. Outdoor finish ready in 21 days."],
  ["AI", "Translation: CIF Bali quote available with outdoor-grade finish."],
  ["Buyer", "Add cushions and split MOQ by SKU."],
];

const restaurantLives = [
  {
    title: "Chef tasting menu live",
    venue: "Seminyak supper club",
    audience: "1,284 watching",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Dessert demonstration",
    venue: "Ubud patisserie studio",
    audience: "842 watching",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85",
  },
];

export default function Home() {
  return (
    <main className="buyamia-dashboard-shell min-h-screen overflow-hidden bg-[#f3ecdc] text-[#1e2419]">
      <DashboardExperience />

      <section className="hidden">
        <div className="paper-glow pointer-events-none absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#748556]/70 to-transparent" />

        <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-[#d6cbb6] bg-[#fffaf0]/78 px-3 py-3 shadow-sm backdrop-blur-xl sm:px-4">
          <div className="flex items-center gap-3">
            <Image
              src="/buyamia-logo.svg"
              alt="Buyamia logo"
              width={40}
              height={40}
              className="size-10 rounded-full shadow-sm"
              priority
            />
            <div>
              <p className="text-sm font-semibold tracking-wide">Buyamia</p>
              <p className="text-xs text-[#766e5e]">Live AI procurement</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm text-[#675f50] md:flex">
            <a
              className="transition hover:text-[#1e2419]"
              href="#platform-flow"
            >
              Platform
            </a>
            <a
              className="transition hover:text-[#1e2419]"
              href="#seller-payment"
            >
              Sellers
            </a>
            <a className="transition hover:text-[#1e2419]" href="#assistant">
              AI
            </a>
            <a className="transition hover:text-[#1e2419]" href="#wholesale">
              Market
            </a>
            <a
              className="transition hover:text-[#1e2419]"
              href="#hotel-live-access"
            >
              Hotel Live
            </a>
            <a
              className="transition hover:text-[#1e2419]"
              href="#verified-reviews"
            >
              Reviews
            </a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#hotel-auth"
              className="hidden shrink-0 rounded-full border border-[#cabda4] bg-[#fffaf0]/72 px-4 py-2 text-sm font-semibold text-[#1e2419] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#cabda4]/40 sm:inline-flex"
            >
              Sign in
            </a>
            <a
              href="/live"
              className="shrink-0 rounded-full bg-[#1e2419] px-4 py-2 text-sm font-semibold text-[#fffaf0] transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1e2419]/25"
            >
              Join live
            </a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 pt-10 lg:min-h-[calc(100vh-92px)] lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div className="[animation:popIn_.65s_ease-out_both]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d6cbb6] bg-[#fffaf0]/75 px-3 py-1.5 text-xs font-semibold text-[#596540] shadow-sm">
              <span className="size-2 rounded-full bg-[#6f7f4f] [animation:bidPulse_2s_ease-in-out_infinite]" />
              Whatnot-style live sourcing for Indonesian procurement
            </div>
            <h1 className="max-w-4xl font-serif text-3xl leading-[1.08] tracking-normal sm:text-5xl lg:text-6xl">
              Watch suppliers live. Let AI build the procurement case.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#655e50] sm:text-lg">
              Buyamia transforms wholesale sourcing into an AI procurement
              operating system where hospitality buyers watch suppliers live,
              automate RFQs, validate trust, protect payments, and move faster
              with an AI sourcing assistant beside every stream.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/live"
                className="relative overflow-hidden rounded-full bg-[#6f7f4f] px-6 py-4 text-center text-sm font-bold text-white shadow-xl shadow-[#6f7f4f]/18 transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/30"
              >
                <span className="relative z-10">Enter live sourcing floor</span>
                <span className="absolute inset-y-0 left-0 w-1/2 bg-white/30 [animation:drift_2.6s_linear_infinite]" />
              </a>
              <a
                href="#seller-payment"
                className="rounded-full border border-[#cabda4] bg-[#fffaf0]/72 px-6 py-4 text-center text-sm font-bold text-[#1e2419] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#cabda4]/40"
              >
                Book seller live
              </a>
              <a
                href="#assistant"
                className="px-2 py-3 text-center text-sm font-bold text-[#596540] transition hover:text-[#1e2419] sm:text-left"
              >
                Ask Buyamia AI
              </a>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {procurementSignals.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0]/72 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#766e5e]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <HeroLiveStage />
        </div>
      </section>

      <PlatformFlow />

      <RestaurantLiveExperience />

      <HotelLiveAccess />

      <SellerPaymentConsole />

      <ProcurementOSSections />

      <section
        id="streams"
        className="scroll-mt-6 px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Live supplier streams"
            title="A high-energy sourcing floor for premium B2B buyers."
            note="Every stream carries MOQ, verification, wholesale pricing, and an instant RFQ path."
          />

          <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <article className="relative min-h-[540px] overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:min-h-[620px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(30,36,25,.05), rgba(30,36,25,.12) 42%, rgba(30,36,25,.82)), url(https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1300&q=85)",
                }}
              />
              <div className="relative z-10 flex min-h-[540px] flex-col justify-between p-4 sm:min-h-[620px] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
                      LIVE
                    </span>
                    <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#1e2419]">
                      126 buyers
                    </span>
                  </div>
                  <span className="rounded-full bg-[#6f7f4f] px-3 py-1 text-xs font-bold text-white">
                    Verified supplier
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-end">
                  <div className="max-w-2xl">
                    <p className="text-sm font-semibold text-[#f8edda]">
                      Bali Rattan Works - Gianyar, Bali
                    </p>
                    <h2 className="mt-2 font-serif text-2xl leading-tight text-white sm:text-4xl">
                      Resort lounge collection with live MOQ negotiation.
                    </h2>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {["MOQ 24 units", "from $68/unit", "21 day lead time"].map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-full bg-[#fffaf0]/90 px-3 py-1 text-xs font-bold text-[#1e2419]"
                          >
                            {item}
                          </span>
                        ),
                      )}
                    </div>
                    <a
                      href="/live"
                      className="mt-6 inline-flex rounded-full bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1e2419] shadow-xl shadow-black/10 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#fffaf0]/70"
                    >
                      Join this stream
                    </a>
                  </div>
                  <LiveChatCard />
                </div>
              </div>
            </article>

            <div className="grid gap-4">
              {streams.slice(1).map((stream, index) => (
                <StreamCard key={stream.title} stream={stream} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="assistant" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.88fr_1.12fr]">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              AI sourcing assistant
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              The copilot inside every supplier stream.
            </h2>
            <p className="mt-4 leading-8 text-[#655e50]">
              Buyamia AI translates supplier conversations, extracts specs,
              compares landed cost, checks MOQ strategy, and turns live product
              interest into procurement-ready RFQs.
            </p>
            <div className="mt-7 grid gap-3">
              {[
                ["Live translation", "Bahasa Indonesia to English, Arabic, and Mandarin for global buyers."],
                ["Quote builder", "Creates RFQs with incoterms, batch QC, lead time, and packaging notes."],
                ["Risk scan", "Flags missing documents, capacity constraints, and supplier response patterns."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-[#ded4c2] bg-[#f6efe2] p-4"
                >
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#766e5e]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#e9dfcb] p-5 shadow-sm sm:p-8">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#6f7f4f]/15" />
            <div className="relative rounded-[1.55rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-lg shadow-[#8a7d61]/8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Buyamia AI</p>
                  <p className="text-xs text-[#766e5e]">
                    Watching stream and building RFQ
                  </p>
                </div>
                <span className="rounded-full bg-[#1e2419] px-3 py-1 text-xs font-bold text-white">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3">
                {[
                  [
                    "Buyer",
                    "Need 42 villa suites, outdoor finish, custom cushions, CIF Bali.",
                  ],
                  [
                    "AI",
                    "Recommended: split MOQ across chair, daybed, and side table. Estimated landed cost is 12% under target.",
                  ],
                  [
                    "Supplier translated",
                    "Production can start next Monday. Cushion fabric can match the resort palette.",
                  ],
                ].map(([label, message], index) => (
                  <div
                    key={label}
                    className={`rounded-3xl p-4 text-sm leading-6 ${
                      index === 0
                        ? "ml-auto max-w-[86%] bg-[#6f7f4f] font-semibold text-white"
                        : "max-w-[92%] bg-[#f3ecdc] text-[#655e50]"
                    }`}
                  >
                    <span className="mb-1 block text-xs font-bold uppercase tracking-[.16em] opacity-70">
                      {label}
                    </span>
                    {message}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Build RFQ", "Check MOQ", "Translate"].map((action) => (
                  <button
                    key={action}
                    className="rounded-2xl border border-[#d6cbb6] bg-white/50 px-2 py-3 text-xs font-bold transition hover:bg-white"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["96%", "spec fit"],
                ["-12%", "cost delta"],
                ["21d", "lead time"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0]/75 p-4"
                >
                  <p className="text-2xl font-semibold text-[#596540]">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-[#766e5e]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="wholesale" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Wholesale pricing"
            title="Quote-ready cards built for procurement speed."
            note="Modern marketplace discovery with B2B controls: MOQ, supplier proof, and quote actions."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <article
                key={product.name}
                className="group overflow-hidden rounded-[1.7rem] border border-[#d6cbb6] bg-[#fffaf0] shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8a7d61]/12"
                style={{ animation: `popIn .6s ease-out ${index * 0.08}s both` }}
              >
                <div
                  className="relative h-52 bg-cover bg-center"
                  style={{ backgroundImage: `url(${product.image})` }}
                >
                  <span className="absolute left-3 top-3 rounded-full bg-[#fffaf0]/92 px-3 py-1 text-xs font-bold">
                    MOQ {product.moq}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a826f]">
                    verified wholesale
                  </p>
                  <h3 className="mt-3 text-lg font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-[#766e5e]">
                    {product.supplier}
                  </p>
                  <div className="mt-5 flex items-end justify-between rounded-3xl bg-[#f3ecdc] p-4">
                    <div>
                      <p className="text-xs text-[#766e5e]">from</p>
                      <p className="text-2xl font-semibold">{product.price}</p>
                    </div>
                    <button className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1e2419]/25">
                      RFQ
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_.9fr]">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-8">
            <p className="text-sm font-semibold text-[#cbd8a7]">
              Supplier verification
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              Trust signals that move buyers from watching to quoting.
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-[#ded8ca]">
              Buyamia blends marketplace energy with procurement confidence:
              factory checks, export readiness, hospitality references, and AI
              risk summaries stay visible throughout the live experience.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["98", "factory audit"],
                ["96", "export ready"],
                ["94", "hotel references"],
              ].map(([score, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/[.06] p-4"
                >
                  <p className="text-2xl font-semibold text-[#cbd8a7]">
                    {score}
                  </p>
                  <p className="mt-1 text-xs text-[#ded8ca]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[480px] overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-xl shadow-[#8a7d61]/10">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(255,250,240,.06), rgba(255,250,240,.45), rgba(255,250,240,.96)), url(https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1100&q=85)",
              }}
            />
            <div className="relative z-10 flex min-h-[440px] flex-col justify-between">
              <div className="flex justify-end">
                <span className="rounded-full bg-[#6f7f4f] px-3 py-1 text-xs font-bold text-white">
                  Live showcase
                </span>
              </div>
              <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0]/88 p-5 shadow-lg backdrop-blur">
                <p className="text-sm font-semibold text-[#6f7f4f]">
                  Immersive sourcing room
                </p>
                <h3 className="mt-2 font-serif text-2xl leading-tight">
                  Discover artisan furniture, then let AI turn interest into an
                  RFQ.
                </h3>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {["MOQ", "Specs", "Quote"].map((item, index) => (
                    <span
                      key={item}
                      className="rounded-2xl bg-[#f3ecdc] px-3 py-3 text-center text-xs font-bold"
                      style={{
                        animation: `riseCard ${4 + index * 0.5}s ease-in-out ${index * 0.4}s infinite`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EcosystemExpansion />
    </main>
  );
}

const dashboardWorkspaces = [
  ["Overview", "All activity", "12"],
  ["B2B Buyer", "Procurement view", "8"],
  ["Seller Studio", "Stream and sell", "3"],
  ["B2C Buyer", "Instant checkout", "24"],
  ["Experience", "Hotel and restaurant", "5"],
  ["Admin", "Platform ops", "2"],
];

const dashboardStreams = [
  ["Bali Rattan Works", "126 buyers", "LIVE"],
  ["Java Teak Atelier", "62 buyers", "LIVE"],
  ["Lombok Stone Studio", "47 buyers", "LIVE"],
  ["Ubud Fiber House", "Starts 14:30", "NEXT"],
];

const studioActions = [
  "Auto RFQ",
  "Analytics",
  "Live recap",
  "Translate",
  "Escrow",
  "Export docs",
  "Trust scan",
  "Refresh feed",
];

const topSellers = [
  ["Bali Rattan Works", "Platinum - 98% thumbs", "4.9"],
  ["Java Teak Atelier", "Gold - 37% repeat", "4.8"],
  ["Ubud Fiber House", "Silver - 29% repeat", "4.7"],
];

function DashboardExperience() {
  return (
    <section className="dashboard-surface">
      <header className="dashboard-topbar">
        <a href="#dashboard" className="dashboard-brand" aria-label="Buyamia dashboard">
          <Image
            src="/buyamia-logo.svg"
            alt="Buyamia logo"
            width={38}
            height={38}
            className="size-[38px] rounded-xl bg-[#1f2418]"
            priority
          />
          <span>
            <span className="block font-serif text-[17px] font-semibold leading-tight">
              Buyamia
            </span>
            <span className="block text-[11px] font-medium text-[#7a8350]">
              Live AI procurement
            </span>
          </span>
        </a>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {[
            ["Dashboard", "#dashboard"],
            ["Sourcing floor", "#streams"],
            ["RFQs", "#assistant"],
            ["Sellers", "#seller-payment"],
            ["Analytics", "#reviews-analytics"],
          ].map(([label, href], index) => (
            <a
              key={label}
              href={href}
              className={`dashboard-nav-pill ${index === 0 ? "active" : ""}`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="dashboard-actions">
          <a href="/live" className="dashboard-live-pill">
            <span className="dashboard-live-dot" />
            Live now
          </a>
          <button className="dashboard-icon-btn" type="button" aria-label="Search">
            <span aria-hidden="true">S</span>
          </button>
          <button className="dashboard-icon-btn" type="button" aria-label="Notifications">
            <span aria-hidden="true">!</span>
          </button>
          <span className="dashboard-user-chip">
            <span className="dashboard-avatar">AM</span>
            <span className="hidden sm:inline">Account</span>
          </span>
        </div>
      </header>

      <div id="dashboard" className="dashboard-grid">
        <aside className="dashboard-column">
          <DashboardPanel eyebrow="workspaces" title="Dashboards">
            <div className="grid gap-2">
              {dashboardWorkspaces.map(([name, detail, count], index) => (
                <a
                  key={name}
                  href={index === 0 ? "#dashboard" : "#procurement-os"}
                  className={`dashboard-role ${index === 0 ? "active" : ""}`}
                >
                  <span className="dashboard-role-icon">{name.slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="block text-[11px] text-[#6b6855]">{detail}</span>
                  </span>
                  <span className="text-xs font-semibold">{count}</span>
                </a>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="today" title="Your snapshot">
            <div className="grid grid-cols-2 gap-2">
              {procurementSignals.map(([label, value], index) => (
                <div
                  key={label}
                  className={`dashboard-mini-stat ${index === 0 ? "accent" : ""}`}
                >
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{index === 0 ? "+18 today" : "live signal"}</small>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="live now" title="Active streams">
            <div className="grid gap-2">
              {dashboardStreams.map(([name, detail, status]) => (
                <a key={name} href="/live" className="dashboard-stream-item">
                  <span className="dashboard-stream-thumb" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{name}</span>
                    <span className="text-xs text-[#6b6855]">
                      <span className="mr-1 font-black text-[#c75a3a]">{status}</span>
                      {detail}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </DashboardPanel>
        </aside>

        <section className="dashboard-center">
          <div className="dashboard-hero">
            <div className="dashboard-hero-eyebrow">
              <span className="dashboard-live-dot" />
              Live sourcing intelligence
            </div>
            <h1>12 suppliers live now. Let AI build the procurement case.</h1>
            <p>
              Watch verified streams, capture buyer intent, and turn live
              conversations into procurement-ready RFQs across Indonesia,
              Vietnam, and Thailand.
            </p>
            <div className="dashboard-hero-stats">
              {[
                ["12", "live streams"],
                ["847", "buyers watching"],
                ["96%", "avg AI match"],
                ["$1.2M", "RFQs in flight"],
              ].map(([value, label]) => (
                <span key={label}>
                  <strong>{value}</strong>
                  <small>{label}</small>
                </span>
              ))}
            </div>
          </div>

          <form className="dashboard-ai-bar">
            <span className="dashboard-ai-icon">AI</span>
            <label className="min-w-0 flex-1">
              <span>Ask Buyamia AI</span>
              <input
                type="text"
                placeholder="Find rattan suppliers under $80/unit with MOQ <= 24..."
              />
            </label>
            <button type="submit" aria-label="Send AI query">
              Send
            </button>
          </form>

          <div className="dashboard-metrics">
            {[
              ["RFQ heat", "142", "active quotes"],
              ["Avg reply", "17m", "-4m vs week"],
              ["Cost delta", "-12%", "vs initial brief"],
              ["Verified", "2.1K", "audited suppliers"],
            ].map(([label, value, sub], index) => (
              <div key={label} className={`dashboard-metric ${index === 0 ? "accent" : ""}`}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>

          <div className="dashboard-section-head">
            <div>
              <p>Live supplier streams</p>
              <h2>A high-energy sourcing floor for premium B2B buyers.</h2>
            </div>
            <div className="dashboard-chips">
              {["All", "Furniture", "Stone", "Textile"].map((chip, index) => (
                <button key={chip} type="button" className={index === 0 ? "active" : ""}>
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-stream-grid">
            <article className="dashboard-stream-card featured">
              <div
                className="dashboard-stream-media"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(31,36,24,.06), rgba(31,36,24,.82)), url(https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85)",
                }}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="dashboard-badge live">LIVE</span>
                  <span className="dashboard-badge">126 buyers</span>
                </div>
                <div className="dashboard-match-card">
                  <span>AI match score</span>
                  <strong>96%</strong>
                  <small>Fits villa furniture brief, MOQ, and landed cost target.</small>
                </div>
              </div>
              <div className="dashboard-stream-body">
                <p>Bali Rattan Works - Gianyar, Bali</p>
                <h3>Resort lounge collection with live MOQ negotiation.</h3>
                <div className="dashboard-tags">
                  {["MOQ 24 units", "from $68/unit", "21 day lead time"].map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <LiveChatCard />
                <div className="dashboard-card-actions">
                  <a href="/live">Join stream</a>
                  <a href="#assistant">Build RFQ</a>
                </div>
              </div>
            </article>

            <div className="grid gap-3">
              {streams.slice(1).map((stream) => (
                <article key={stream.title} className="dashboard-stream-card compact">
                  <div
                    className="dashboard-stream-media"
                    style={{ backgroundImage: `url(${stream.image})` }}
                  >
                    <span className="dashboard-badge live">LIVE</span>
                    <span className="dashboard-badge">{stream.viewers}</span>
                  </div>
                  <div className="dashboard-stream-body">
                    <p>{stream.supplier} - {stream.region}</p>
                    <h3>{stream.title}</h3>
                    <div className="dashboard-tags">
                      {[stream.moq, stream.price, stream.verified].map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <a className="dashboard-compact-link" href="/live">
                      Join stream
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="dashboard-column">
          <div className="dashboard-copilot">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p>AI sourcing assistant</p>
                <h2>Buyamia AI</h2>
              </div>
              <span>ACTIVE</span>
            </div>
            <div className="dashboard-copilot-msg">
              <strong>Buyer</strong>
              Need 42 villa suites, outdoor finish, custom cushions, CIF Bali.
            </div>
            <div className="dashboard-copilot-msg ai">
              <strong>AI</strong>
              Recommended: split MOQ across chair, daybed, and side table.
              Estimated landed cost is 12% under target.
            </div>
            <div className="dashboard-copilot-actions">
              {["Build RFQ", "Check MOQ", "Translate"].map((action) => (
                <button key={action} type="button">{action}</button>
              ))}
            </div>
          </div>

          <DashboardPanel eyebrow="studio" title="Actions & outputs">
            <div className="dashboard-studio-grid">
              {studioActions.map((action, index) => (
                <a
                  key={action}
                  href="#assistant"
                  className={index === 1 || index === 7 ? "dark" : ""}
                >
                  <span>{action}</span>
                  <strong>&gt;</strong>
                </a>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="today" title="Top sellers" dark>
            <div className="grid gap-2">
              {topSellers.map(([name, meta, score], index) => (
                <div key={name} className="dashboard-leader-row">
                  <span>{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <strong>{name}</strong>
                    <small>{meta}</small>
                  </span>
                  <b>{score}</b>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </aside>
      </div>

      <p className="dashboard-footer-note">
        Buyamia AI may make mistakes. Verify supplier claims, MOQs, and landed
        costs before contracting.
      </p>
    </section>
  );
}

function DashboardPanel({
  eyebrow,
  title,
  children,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`dashboard-panel ${dark ? "dark" : ""}`}>
      <p className="dashboard-panel-eyebrow">{eyebrow}</p>
      <h2 className="dashboard-panel-title">{title}</h2>
      {children}
    </div>
  );
}

function PlatformFlow() {
  return (
    <section
      id="platform-flow"
      className="scroll-mt-6 px-4 pb-8 pt-2 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0]/72 p-4 shadow-sm backdrop-blur-xl sm:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          {platformFlow.map(([step, title, body]) => (
            <div
              key={step}
              className="rounded-[1.35rem] border border-[#ded4c2] bg-[#f6efe2]/80 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                {step}
              </p>
              <h2 className="mt-3 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#675f50]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RestaurantLiveExperience() {
  return (
    <section id="restaurant-live" className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.95fr_1.05fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#fffaf0]/10 px-3 py-1.5 text-xs font-bold text-[#cbd8a7]">
            <span className="size-2 rounded-full bg-[#b85438] [animation:bidPulse_2s_ease-in-out_infinite]" />
            Restaurant and experience lives
          </div>
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Live cooking, chef streams, tastings, and restaurant discovery.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#ded8ca]">
            Buyamia extends beyond procurement into AI-native live experiences:
            watch chefs cook, discover restaurant showcases, order live with
            Grab or Gojek, reserve a table, and book tasting experiences in the
            same premium commerce flow.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Live cooking",
              "Chef livestreams",
              "Dessert demonstrations",
              "Live restaurant discovery",
              "Reserve table",
              "Book tasting experiences",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-semibold"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#restaurant-live"
              className="rounded-full bg-[#fffaf0] px-5 py-3 text-center text-sm font-bold text-[#1e2419] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#fffaf0]/70"
            >
              Order now
            </a>
            <a
              href="#restaurant-live"
              className="rounded-full border border-[#fffaf0]/20 bg-[#fffaf0]/10 px-5 py-3 text-center text-sm font-bold text-[#fffaf0] transition hover:bg-[#fffaf0]/16 focus:outline-none focus:ring-2 focus:ring-[#fffaf0]/50"
            >
              Book table
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {restaurantLives.map((live, index) => (
            <article
              key={live.title}
              className="group relative min-h-[420px] overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] shadow-xl shadow-[#8a7d61]/10"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.03]"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(31,37,26,.06), rgba(31,37,26,.18) 42%, rgba(31,37,26,.84)), url(${live.image})`,
                }}
              />
              <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white shadow-lg">
                    LIVE
                  </span>
                  <span className="rounded-full bg-[#fffaf0]/88 px-3 py-1 text-xs font-bold text-[#1e2419] shadow-lg backdrop-blur">
                    {live.audience}
                  </span>
                </div>

                <div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {(index === 0
                      ? ["Order with Grab", "Reserve tasting"]
                      : ["Order with Gojek", "Dessert drop"]
                    ).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-[#fffaf0]/90 px-3 py-1 text-xs font-bold text-[#1e2419]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-[#f8edda]">
                    {live.venue}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-tight text-white">
                    {live.title}
                  </h3>
                  <div className="mt-5 grid gap-2">
                    <button className="rounded-full bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#1e2419] transition hover:bg-white">
                      Order now
                    </button>
                    <button className="rounded-full bg-[#6f7f4f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#596540]">
                      Book table
                    </button>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute right-4 top-20 z-20 flex flex-col gap-2">
                {["♥", "★", "+"].map((reaction, reactionIndex) => (
                  <span
                    key={`${live.title}-${reaction}`}
                    className="grid size-8 place-items-center rounded-full bg-[#fffaf0]/70 text-xs font-black text-[#596540] shadow-xl backdrop-blur"
                    style={{
                      animation: `floatLift ${3 + reactionIndex * 0.4}s ease-in-out infinite`,
                    }}
                  >
                    {reaction}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroLiveStage() {
  return (
    <div className="relative mx-auto w-full max-w-[620px] [animation:popIn_.8s_ease-out_.08s_both]">
      <div className="absolute -left-2 top-16 z-20 hidden w-48 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0]/92 p-4 shadow-xl shadow-[#8a7d61]/12 backdrop-blur-xl sm:block lg:-left-8">
        <p className="text-xs font-semibold text-[#6f7f4f]">AI match score</p>
        <p className="mt-2 text-2xl font-semibold">96%</p>
        <p className="mt-1 text-xs leading-5 text-[#766e5e]">
          Fits villa furniture brief, MOQ, and landed cost target.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2.2rem] border border-[#d6cbb6] bg-[#fffaf0] p-3 shadow-2xl shadow-[#8a7d61]/18">
        <div
          className="relative min-h-[540px] overflow-hidden rounded-[1.65rem] bg-cover bg-center sm:min-h-[650px]"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(30,36,25,.04), rgba(30,36,25,.15) 42%, rgba(30,36,25,.88)), url(https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85)",
          }}
        >
          <div className="flex items-center justify-between p-4">
            <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
              LIVE
            </span>
            <span className="rounded-full bg-[#fffaf0]/92 px-3 py-1 text-xs font-bold">
              126 buyers sourcing
            </span>
          </div>

          <div className="flex min-h-[465px] flex-col justify-end p-4 sm:min-h-[575px]">
            <div className="mb-4 w-full rounded-3xl border border-white/20 bg-[#fffaf0]/92 p-4 shadow-lg backdrop-blur sm:w-fit">
              <p className="text-xs text-[#766e5e]">Pinned supplier offer</p>
              <p className="mt-1 text-lg font-semibold">
                Rattan lounge set - MOQ 24 - $68/unit
              </p>
              <button className="mt-3 rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1e2419]/25">
                Request quote
              </button>
            </div>
            <LiveChatCard />
          </div>
        </div>
      </div>

      <div className="absolute -right-1 bottom-20 z-20 hidden flex-col gap-3 sm:flex lg:-right-8">
        {["MOQ split", "Quote ready", "Verified"].map((item, index) => (
          <div
            key={item}
            className="rounded-full border border-[#d6cbb6] bg-[#fffaf0]/92 px-3 py-2 text-xs font-bold text-[#3e4930] shadow-lg shadow-[#8a7d61]/12 backdrop-blur-xl"
            style={{
              animation: `floatLift ${3 + index * 0.35}s ease-in-out infinite`,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function StreamCard({ stream, index }: { stream: Stream; index: number }) {
  return (
    <article
      className="grid overflow-hidden rounded-[1.7rem] border border-[#d6cbb6] bg-[#fffaf0] shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8a7d61]/12 sm:grid-cols-[170px_1fr]"
      style={{ animation: `popIn .6s ease-out ${index * 0.1}s both` }}
    >
      <div
        className="min-h-48 bg-cover bg-center sm:min-h-full"
        style={{ backgroundImage: `url(${stream.image})` }}
      />
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
            LIVE
          </span>
          <span className="rounded-full bg-[#6f7f4f] px-3 py-1 text-xs font-bold text-white">
            {stream.verified}
          </span>
        </div>
        <p className="text-xs uppercase tracking-[.16em] text-[#8a826f]">
          {stream.supplier} - {stream.region}
        </p>
        <h3 className="mt-2 text-xl font-semibold">{stream.title}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {[stream.viewers, stream.moq, stream.price].map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#d6cbb6] bg-[#f3ecdc] px-3 py-1 text-xs font-bold"
            >
              {item}
            </span>
          ))}
        </div>
        <button className="mt-5 rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#1e2419]/25">
          Join stream
        </button>
      </div>
    </article>
  );
}

function LiveChatCard() {
  return (
    <div className="rounded-3xl border border-white/25 bg-[#fffaf0]/92 p-3 shadow-xl shadow-[#1e2419]/15 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-[#1e2419]">Live procurement feed</p>
        <span className="rounded-full bg-[#6f7f4f] px-2 py-1 text-[10px] font-bold text-white">
          AI translated
        </span>
      </div>
      <div className="space-y-2">
        {chatFeed.map(([name, message]) => (
          <div key={`${name}-${message}`} className="flex gap-2 text-xs">
            <span className="shrink-0 font-bold text-[#596540]">{name}</span>
            <span className="text-[#5f584b]">{message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note: string;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-[#6f7f4f]">{eyebrow}</p>
        <h2 className="mt-2 max-w-3xl font-serif text-3xl leading-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      <p className="max-w-md text-sm leading-6 text-[#766e5e]">{note}</p>
    </div>
  );
}
