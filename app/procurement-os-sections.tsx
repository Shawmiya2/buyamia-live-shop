import Link from "next/link";

const trustBadges = [
  ["Verified supplier", "Business identity, ownership, and export documents checked."],
  ["Export-ready", "Packaging, shipping docs, and customs workflow prepared."],
  ["Factory audit 98", "Capacity, QC process, and production readiness scored."],
  ["Hotel references", "Transaction-linked hospitality buyers and project history."],
];

const aiCopilot = [
  ["Translate supplier conversations", "Live multilingual procurement context."],
  ["Generate RFQs automatically", "Specs, MOQ, incoterms, payment, and docs."],
  ["Suggest MOQ optimization", "Split bundles, container fit, and price breaks."],
  ["Estimate landed costs", "Product, freight, duties, lead time, and risk."],
  ["Recommend logistics", "Instant, scheduled, standard, or container strategy."],
  ["Flag procurement risks", "Missing docs, capacity pressure, unusual terms."],
];

const securityItems = [
  ["Escrow protection", "Funds held until agreed procurement checkpoints clear."],
  ["Contracts", "AI-prepared terms for MOQ, warranty, delivery, and QC."],
  ["Warranty system", "Product coverage and supplier response commitments."],
  ["Documentation vault", "Invoices, export docs, certificates, and RFQ history."],
  ["Delivery scheduling", "Reserve production windows and shipment milestones."],
  ["Payment protection", "Apple Pay, Stripe, wire transfer, and QR status UI."],
];

const analyticsRows = [
  ["RFQ conversion", "18.4%", 78],
  ["Peak emotion", "21:10", 88],
  ["Best product", "Rattan chair", 64],
  ["Audience regions", "12 markets", 72],
];

export function ProcurementOSSections() {
  return (
    <>
      <section id="procurement-os" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-xl shadow-[#8a7d61]/8 sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">
                AI procurement operating system
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
                From live discovery to protected procurement workflow.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#675f50]">
                Buyamia connects live supplier storytelling, AI sourcing,
                automated RFQs, trusted verification, protected payments,
                overstock liquidation, and hospitality experiences in one
                operating layer.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/live"
                  className="rounded-full bg-[#1f251a] px-5 py-3 text-center text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                >
                  Open live room
                </Link>
                <a
                  href="#seller-payment"
                  className="rounded-full border border-[#d6cbb6] bg-[#f3ecdc] px-5 py-3 text-center text-sm font-bold text-[#1f251a] transition hover:bg-[#efe5d2]"
                >
                  Book seller live
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["B2B mode", "RFQ, contracts, escrow, meetings"],
                ["B2C mode", "Instant checkout, rewards, flash deals"],
                ["Experience mode", "Hotels, restaurants, tastings"],
                ["Overstock mode", "Urgent liquidation streams"],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[1.5rem] border border-[#ded4c2] bg-[#f6efe2] p-4 transition hover:-translate-y-0.5 hover:bg-[#f3ecdc]"
                >
                  <p className="font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#675f50]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="trust-security" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_.95fr]">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
            <p className="text-sm font-semibold text-[#cbd8a7]">
              Supplier verification system
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight">
              Trust badges that make global sourcing feel safe.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustBadges.map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[.06] p-4"
                >
                  <p className="font-semibold text-[#cbd8a7]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#ded7c9]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Anti-fake account checks", "Certified buyer reviews", "Verified documents"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#fffaf0]/10 px-3 py-1.5 text-xs font-bold"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Procurement security
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight">
              Contracts, warranty, escrow, shipping, and documentation.
            </h2>
            <div className="mt-5 grid gap-3">
              {securityItems.map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[1.3rem] bg-[#f3ecdc] p-4"
                >
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#675f50]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ai-procurement" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold text-[#6f7f4f]">
              AI procurement copilot
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              AI turns messy live conversations into procurement clarity.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#675f50]">
              The assistant observes the livestream, structures demand,
              captures buyer intent, builds RFQs, summarizes supplier claims,
              and flags risks before a buyer commits.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {aiCopilot.map(([title, body]) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8a7d61]/10"
              >
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#675f50]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="overstock" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(31,37,26,.2), rgba(31,37,26,.86)), url(https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85)",
              }}
            />
            <div className="relative z-10 flex min-h-[408px] flex-col justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black">
                  OVERSTOCK LIVE
                </span>
                <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">
                  Flash liquidation
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#cbd8a7]">
                  Urgent wholesale offers
                </p>
                <h2 className="mt-2 font-serif text-3xl leading-tight">
                  Suppliers can instantly go live to clear inventory.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#ded7c9]">
                  Overstock mode creates fast live rooms for excess inventory,
                  discounted MOQs, liquidation bundles, buyer alerts, and
                  AI-generated urgency copy.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              ["Start now", "Paid sellers can open urgent inventory lives instantly."],
              ["Flash wholesale", "Temporary quantity breaks with protected checkout."],
              ["AI alerting", "Notify buyers whose briefs match the overstock lot."],
              ["Liquidation RFQ", "Generate a one-click RFQ for the full bundle."],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm"
              >
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#675f50]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews-analytics" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Reviews and trust
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-tight">
              Only real transactions can shape supplier reputation.
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                ["AI review moderation", "Flags promotional, suspicious, or duplicate reviews."],
                ["Transaction-linked reviews", "Only verified buyers can review a supplier."],
                ["Authenticity indicators", "Shows document match, order ID, and buyer segment."],
                ["Supplier trust score", "Blends audit, delivery, disputes, reviews, and repeat buyers."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[1.3rem] bg-[#f3ecdc] p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#675f50]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#cbd8a7]">
                  Premium analytics dashboard
                </p>
                <h2 className="mt-2 font-serif text-2xl leading-tight">
                  RFQ conversion, emotional peaks, regions, and product winners.
                </h2>
              </div>
            </div>
            <div className="grid gap-3">
              {analyticsRows.map(([label, value, width]) => (
                <div key={label} className="rounded-[1.3rem] bg-white/[.06] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-sm font-bold text-[#cbd8a7]">{value}</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-[#cbd8a7]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
