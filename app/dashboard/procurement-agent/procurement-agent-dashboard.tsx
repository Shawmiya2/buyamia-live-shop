"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProcurementAgentDashboardData } from "@/lib/backend/types";

export function ProcurementAgentDashboard({
  data,
}: {
  data: ProcurementAgentDashboardData;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const topChannel = data.conversionAttribution.topChannel;
  const liveSessions = useMemo(() => data.shareableSessions.slice(0, 5), [data.shareableSessions]);

  async function copyReferralLink(id: string, referralLink: string) {
    const absoluteLink = new URL(referralLink, window.location.origin).toString();
    await navigator.clipboard.writeText(absoluteLink);
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 1500);
  }

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
              Main-admin preview
            </p>
            <h1 className="mt-1 font-serif text-4xl leading-tight">
              Procurement Agent Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#675f50]">
              B2B referral operations for procurement agents, designers, consultants, and hospitality buyers. The affiliate model stays separate from consumer tips or gifting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/main" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
              Main dashboard
            </Link>
            <Link href="/live" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">
              Shareable live catalog
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Total clicks" value={formatNumber(data.totalClicks)} detail="Clicks from tracked referral links." />
          <SummaryCard label="Referred sessions" value={formatNumber(data.referredSessions)} detail="Sessions that converted from affiliate traffic." />
          <SummaryCard label="Attributed RFQs/orders" value={formatNumber(data.attributedRfqs + data.attributedOrders)} detail={`${formatNumber(data.attributedRfqs)} RFQs and ${formatNumber(data.attributedOrders)} orders.`} />
          <SummaryCard label="Estimated commission" value={formatCurrency(data.estimatedCommission)} detail="Demo commission model, not a payout engine." tone="dark" />
          <SummaryCard label="Conversion rate" value={`${data.conversionRate}%`} detail={`Top channel: ${topChannel.label}`} />
        </section>

        <section className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                Shareable sessions
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Tracked referral links for live sourcing sessions</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#675f50]">
                Generated referral links are fixed for this session and tied to the same live IDs used by the attribution summaries.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
              {topChannel.label} is leading
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {liveSessions.map((session) => (
              <article key={session.id} className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                      {session.featureCategory}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{session.title}</h3>
                    <p className="mt-1 text-sm text-[#675f50]">
                      {session.providerName} - {session.providerRole.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#1e2419] px-3 py-1 text-xs font-black text-[#fffaf0]">
                      Trust {session.trustScore.score}
                    </span>
                    {session.isPinned ? (
                      <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
                        {session.featureBadge}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                        {session.featureBadge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs font-bold text-[#596540] sm:grid-cols-2">
                  <span>Status: {session.status.replace(/_/g, " ")}</span>
                  <span>{session.isPinned ? `Pinned: ${session.pinReason?.replace(/_/g, " ") ?? "featured"}` : "Not pinned"}</span>
                  <span>{session.status === "replay" ? "Replay label" : "Upcoming label"}: {session.replay.status.replace(/_/g, " ")}</span>
                  <span>Source: {session.featureReason}</span>
                </div>

                <div className="mt-4 rounded-2xl border border-[#cabda4] bg-[#fffaf0] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">
                    Referral link
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-[#1e2419]">
                    {session.referralLink}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/live/${session.id}`} className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">
                    View live
                  </Link>
                  <button
                    type="button"
                    onClick={() => copyReferralLink(session.id, session.referralLink)}
                    className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]"
                  >
                    {copiedId === session.id ? "Copied" : "Copy referral link"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                  Referred lives
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Commissions and attribution table</h2>
              </div>
              <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                Main-admin access
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-[#d6cbb6]">
              <div className="grid grid-cols-[1.5fr_.7fr_.7fr_.8fr_.8fr_.8fr_auto] gap-2 bg-[#1e2419] px-4 py-3 text-xs font-black uppercase tracking-[.12em] text-[#fffaf0]">
                <span>Live</span>
                <span>Source</span>
                <span>Clicks</span>
                <span>Sessions</span>
                <span>RFQs / Orders</span>
                <span>Commission</span>
                <span>Copy</span>
              </div>
              {data.referredLives.map((row) => (
                <div key={row.liveId} className="grid grid-cols-[1.5fr_.7fr_.7fr_.8fr_.8fr_.8fr_auto] gap-2 border-t border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{row.title}</p>
                    <p className="mt-1 text-xs text-[#675f50]">{row.providerName} - {row.category}</p>
                  </div>
                  <span>{row.referralSourceLabel}</span>
                  <span>{formatNumber(row.clicks)}</span>
                  <span>{formatNumber(row.referredSessions)}</span>
                  <span>{formatNumber(row.attributedRfqs + row.attributedOrders)}</span>
                  <span className="font-semibold text-[#596540]">{formatCurrency(row.estimatedCommission)}</span>
                  <button
                    type="button"
                    onClick={() => copyReferralLink(row.liveId, row.referralLink)}
                    className="w-fit rounded-full border border-[#cabda4] bg-[#f3ecdc] px-3 py-1.5 text-xs font-bold text-[#1e2419]"
                  >
                    {copiedId === row.liveId ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                Top performing live
              </p>
              {data.topPerformingLive ? (
                <>
                  <h3 className="mt-2 text-2xl font-semibold">{data.topPerformingLive.title}</h3>
                  <p className="mt-1 text-sm text-[#675f50]">
                    {data.topPerformingLive.providerName} - {data.topPerformingLive.referralSourceLabel}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm font-semibold text-[#675f50]">
                    <span>Clicks: {formatNumber(data.topPerformingLive.clicks)}</span>
                    <span>Sessions: {formatNumber(data.topPerformingLive.referredSessions)}</span>
                    <span>RFQs / Orders: {formatNumber(data.topPerformingLive.attributedRfqs + data.topPerformingLive.attributedOrders)}</span>
                    <span>Commission: {formatCurrency(data.topPerformingLive.estimatedCommission)}</span>
                  </div>
                  <Link href={`/live/${data.topPerformingLive.liveId}`} className="mt-5 inline-flex rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
                    View live
                  </Link>
                </>
              ) : (
                <p className="mt-3 text-sm text-[#675f50]">No referral data yet.</p>
              )}
            </div>

            <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                Attribution note
              </p>
              <p className="mt-2 text-sm leading-6 text-[#675f50]">
                Referral rows are generated from live session data and then blended with the existing attribution summary so tracked source performance stays aligned with the broader analytics model.
              </p>
              <div className="mt-4 rounded-2xl bg-[#f3ecdc] p-4">
                <p className="text-sm font-bold text-[#1e2419]">Tracked conversion source mix</p>
                <p className="mt-1 text-xs leading-5 text-[#675f50]">
                  Top channel: {topChannel.label} with {formatNumber(topChannel.conversions)} conversions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "dark";
}) {
  return (
    <article className={`rounded-3xl border p-4 shadow-sm ${tone === "dark" ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]" : "border-[#d6cbb6] bg-[#fffaf0]"}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[.14em] ${tone === "dark" ? "text-[#cbd8a7]" : "text-[#6f7f4f]"}`}>
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className={`mt-2 text-xs leading-5 ${tone === "dark" ? "text-[#ded8ca]" : "text-[#675f50]"}`}>
        {detail}
      </p>
    </article>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
