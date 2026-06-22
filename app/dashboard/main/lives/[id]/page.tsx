import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/backend/auth-context";
import { ApiError } from "@/lib/backend/errors";
import { getLiveDetailsById } from "@/lib/backend/live-service";
import type { LiveEvent } from "@/lib/backend/types";
import { LiveAdminActions } from "../live-admin-actions";

export const metadata: Metadata = {
  title: "Live Details",
  description: "Main admin live details and controls.",
};

export default async function MainLiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("main_admin");
  const { id } = await params;
  let live: LiveEvent;

  try {
    live = await getLiveDetailsById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="min-h-dvh bg-[#f3ecdc] text-[#1e2419]">
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Live details</p>
              <h1 className="mt-1 font-serif text-4xl leading-tight">{live.title}</h1>
              <p className="mt-2 text-sm font-semibold text-[#675f50]">
                {live.providerName} - {formatLabel(live.providerRole)}
              </p>
            </div>
            <Link href="/dashboard/main/lives" className="w-fit rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
              Back to all lives
            </Link>
          </div>
        </div>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <Badge>{formatLabel(live.status)}</Badge>
            <Badge>{live.category}</Badge>
            <Badge>{live.isPinned ? `Pinned: ${formatLabel(live.pinReason ?? "featured_by_buyamia")}` : "Not pinned"}</Badge>
            <Badge>{replayExpirationLabel(live)}</Badge>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Detail label="Provider name" value={live.providerName} />
            <Detail label="Provider role" value={formatLabel(live.providerRole)} />
            <Detail label="Category" value={live.category} />
            <Detail label="Live status" value={formatLabel(live.status)} />
            <Detail label="Scheduled date" value={formatDate(live.startsAt)} />
            <Detail label="Viewer count" value={formatNumber(live.viewerCount)} />
            <Detail label="Replay views" value={formatNumber(live.replayViews)} />
            <Detail label="Conversion intent" value={`${live.conversionIntent}%`} />
            <Detail label="Replay expiration" value={replayExpirationLabel(live)} />
            <Detail label="Replay status" value={formatLabel(live.replay.status)} />
            <Detail label="Pinned state" value={live.isPinned ? "Pinned" : "Not pinned"} />
            <Detail label="Pin reason" value={live.pinReason ? formatLabel(live.pinReason) : "None"} />
          </dl>
          <LiveAdminActions live={live} />
        </section>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-4">
      <dt className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#1e2419]">{value}</dd>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{children}</span>;
}

function replayExpirationLabel(live: LiveEvent) {
  if (!live.replay.expiresAt || live.replay.status === "expired") {
    return "Replay expired";
  }
  return live.replay.daysRemaining === 1
    ? "Replay expires in 1 day"
    : `Replay expires in ${live.replay.daysRemaining} days`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}
