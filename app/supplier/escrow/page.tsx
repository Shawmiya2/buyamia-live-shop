"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EscrowItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  rfq?: { title: string } | null;
  messages: { id: string; body: string; createdAt: string; author: { name: string } }[];
};

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

export default function SupplierEscrowPage() {
  const [items, setItems] = useState<EscrowItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("recent");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/supplier/escrow");
      const payload = (await response.json()) as Envelope<EscrowItem[]>;
      if (!payload.success) throw new Error(payload.error.message);
      setItems(payload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load protected transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => (!status || item.status === status) && (!query || `${item.title} ${item.rfq?.title ?? ""}`.toLowerCase().includes(query)))
      .sort((a, b) => sort === "oldest" ? Date.parse(a.createdAt) - Date.parse(b.createdAt) : sort === "completed" ? Number(b.status === "closed") - Number(a.status === "closed") : Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [items, search, sort, status]);

  async function update(item: EscrowItem, nextStatus: string) {
    setMessage("");
    const response = await fetch(`/api/supplier/escrow/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, message: `Supplier updated escrow status to ${nextStatus}.` }),
    });
    const payload = (await response.json()) as Envelope<EscrowItem>;
    if (!payload.success) {
      setMessage(payload.error.fields?.status ?? payload.error.message);
      return;
    }
    setItems((current) => current.map((entry) => entry.id === payload.data.id ? payload.data : entry));
    setMessage("Escrow record updated.");
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6"><Link href="/dashboard/supplier" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">Back to supplier dashboard</Link></nav>
        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Payment protection</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-5xl">Supplier escrow records</h1>
          <p className="mt-3 text-sm text-[#675f50]">Review supplier-owned protected negotiations, their current stage, and transaction history.</p>
        </section>
        <section className="mt-5 grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 md:grid-cols-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or RFQ" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm"><option value="">All statuses</option><option value="open">Open</option><option value="awaiting_response">Pending release</option><option value="paused">Paused</option><option value="closed">Completed</option></select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm"><option value="recent">Most recent</option><option value="oldest">Oldest</option><option value="completed">Completed</option></select>
        </section>
        {message ? <p className="mt-4 rounded-2xl bg-[#e9dfcb] p-3 text-sm font-semibold">{message}</p> : null}
        <section className="mt-5 grid gap-3">
          {loading ? <p className="rounded-3xl bg-[#fffaf0] p-5">Loading escrow records…</p> : null}
          {!loading && visible.length === 0 ? <p className="rounded-3xl bg-[#fffaf0] p-5">No escrow records match these filters.</p> : null}
          {visible.map((item) => (
            <article key={item.id} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-[#675f50]">Order reference {item.rfq?.title ?? item.id} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p></div>
                <span className="rounded-full bg-[#dfe7c7] px-3 py-1 text-xs font-bold">{item.status.replaceAll("_", " ")}</span>
              </div>
              <details className="mt-3 rounded-2xl bg-[#f3ecdc] p-3 text-sm"><summary className="cursor-pointer font-semibold">Transaction history ({item.messages.length})</summary><div className="mt-2 grid gap-2">{item.messages.map((entry) => <p key={entry.id}>{entry.body} — {entry.author.name}</p>)}</div></details>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.status === "open" || item.status === "paused" ? <button onClick={() => void update(item, "awaiting_response")} className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-bold">Confirm shipment</button> : null}
                {item.status === "awaiting_response" ? <button onClick={() => void update(item, "closed")} className="rounded-full bg-[#1f251a] px-3 py-2 text-xs font-bold text-[#fffaf0]">Mark completed</button> : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
