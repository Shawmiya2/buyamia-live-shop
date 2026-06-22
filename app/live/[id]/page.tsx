import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveById } from "@/lib/backend/live-service";
import { LiveDetailActions } from "./live-detail-actions";

export default async function LiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const live = await getLiveById(id).catch(() => null);

  if (!live) {
    notFound();
  }

  const replayExpired = live.status === "replay" && live.replay.status === "expired";

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-bold text-[#596540]">Buyamia</Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/live" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
              All live streams
            </Link>
            <Link href="/signup" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">
              Create account
            </Link>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-3xl border border-[#1e2419] bg-[#1e2419] text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
            <div className="grid min-h-[360px] place-items-center bg-[#151a12] p-6">
              <div className="max-w-lg text-center">
                <p className="text-sm font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                  {replayExpired ? "Replay unavailable" : "Demo player"}
                </p>
                <h1 className="mt-3 font-serif text-4xl leading-tight">{live.title}</h1>
                <p className="mt-4 text-sm leading-7 text-[#ded8ca]">
                  {replayExpired
                    ? "This replay has expired and cannot be watched."
                    : "Cloud video streaming is not configured in local development, so this page shows a labelled demo player state."}
                </p>
              </div>
            </div>
            <div className="bg-[#fffaf0] p-6 text-[#1e2419]">
              <p className="text-sm font-semibold text-[#6f7f4f]">{live.providerName}</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight">{live.title}</h2>
              <dl className="mt-6 grid gap-3 text-sm">
                <Detail label="Category" value={live.category} />
                <Detail label="Provider role" value={live.providerRole.replace(/_/g, " ")} />
                <Detail label="Status" value={live.status} />
                <Detail label="Pinned" value={live.isPinned ? `Yes: ${live.pinReason?.replace(/_/g, " ")}` : "No"} />
                <Detail label="Pin expires" value={live.pinExpiresAt ? formatDate(live.pinExpiresAt) : "Not pinned"} />
                <Detail label="Replay expires" value={live.replay.expiresAt ? formatDate(live.replay.expiresAt) : "No replay window"} />
                <Detail label="Replay state" value={live.replay.status.replace(/_/g, " ")} />
                <Detail label="Days remaining" value={String(live.replay.daysRemaining)} />
              </dl>
            </div>
          </div>
        </section>

        <LiveDetailActions liveId={live.id} providerId={live.providerId} title={live.title} />
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f3ecdc] p-3">
      <dt className="font-bold text-[#596540]">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
