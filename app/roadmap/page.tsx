import Link from "next/link";
import { getConciergeRoadmap } from "@/lib/backend/concierge-service";

export const metadata = {
  title: "Buyamia Roadmap",
  description: "Buyamia strategic roadmap including last-mile concierge.",
};

export default async function RoadmapPage() {
  const roadmap = await getConciergeRoadmap();

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[#d6cbb6] pb-5">
          <Link href="/" className="text-sm font-bold text-[#596540]">Buyamia</Link>
          <h1 className="mt-2 font-serif text-4xl">Strategic roadmap</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#675f50]">
            Four presentation-ready ideas, with the last-mile concierge now backed by persistent buyer intent records and local demo adapters.
          </p>
        </header>
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {roadmap.ideas.map((idea) => (
            <article key={idea.title} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Roadmap idea</p>
              <h2 className="mt-2 text-xl font-semibold">{idea.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#675f50]">{idea.summary}</p>
            </article>
          ))}
        </section>
        <section className="mt-6 rounded-3xl border border-[#1e2419] bg-[#1e2419] p-5 text-[#fffaf0]">
          <h2 className="text-xl font-semibold">Last-mile concierge status</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric label="Open" value={roadmap.conciergeSummary.openRequests} />
            <Metric label="Waiting buyer" value={roadmap.conciergeSummary.waitingForBuyer} />
            <Metric label="Waiting provider" value={roadmap.conciergeSummary.waitingForProvider} />
            <Metric label="Arranged" value={roadmap.conciergeSummary.arrangedOutcomes} />
          </div>
          <p className="mt-4 text-sm leading-7 text-[#ded8ca]">
            External delivery, payment, insurance, KYC, and livestream providers remain local demo adapters until real integrations are configured.
          </p>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[.08] p-4">
      <p className="text-xs font-bold text-[#cbd8a7]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
