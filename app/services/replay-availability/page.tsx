"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { LiveEvent } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

const replayStatuses = [
  ["", "All replay statuses"],
  ["active", "Active"],
  ["expiring_soon", "Expiring soon"],
  ["expired", "Expired"],
] as const;

const sortOptions = [
  ["expiring_soon", "Expiring soon"],
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["most_viewed", "Most viewed"],
] as const;

export default function ReplayAvailabilityPage() {
  const [replays, setReplays] = useState<LiveEvent[]>([]);
  const [selected, setSelected] = useState<LiveEvent | null>(null);
  const [filters, setFilters] = useState({ replayStatus: "", availability: "", createdAt: "", expiresAt: "", category: "", sort: "expiring_soon" });
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    loadReplays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function loadReplays() {
    setLoading(true);
    fetch(`/api/services/replay-availability?${query}`)
      .then((response) => response.json())
      .then((payload: ApiEnvelope<LiveEvent[]>) => {
        if (payload.success) {
          setReplays(payload.data);
          const nextSelected = selected ? payload.data.find((item) => item.id === selected.id) ?? null : payload.data[0] ?? null;
          setSelected(nextSelected);
          setExpirationDate(nextSelected?.replay.expiresAt ? new Date(nextSelected.replay.expiresAt).toISOString().slice(0, 10) : "");
        } else {
          setMessage(payload.error.message);
        }
      })
      .catch(() => setMessage("Unable to load service replays."))
      .finally(() => setLoading(false));
  }

  function choose(replay: LiveEvent) {
    setSelected(replay);
    setExpirationDate(replay.replay.expiresAt ? new Date(replay.replay.expiresAt).toISOString().slice(0, 10) : "");
    setFields({});
    setMessage("");
  }

  async function updateReplay(input: Record<string, string | boolean>) {
    if (!selected) return;
    setPending(true);
    setFields({});
    setMessage("");
    try {
      const response = await fetch(`/api/services/replay-availability/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as ApiEnvelope<LiveEvent>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setSelected(payload.data);
      setExpirationDate(payload.data.replay.expiresAt ? new Date(payload.data.replay.expiresAt).toISOString().slice(0, 10) : "");
      setReplays((current) => current.map((item) => item.id === payload.data.id ? payload.data : item));
      setMessage("Replay availability updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update replay availability.");
    } finally {
      setPending(false);
    }
  }

  function submitExpiration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateReplay({ expirationDate });
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/services" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to services dashboard
          </Link>
          <Link href="/live/schedule" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Set up a live
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Replay availability</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">Extend service replay access</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Manage expiration and visibility for completed service live replays without opening the Services Dashboard layout.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <select className={inputClass()} value={filters.replayStatus} onChange={(event) => setFilters({ ...filters, replayStatus: event.target.value })}>
              {replayStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className={inputClass()} value={filters.availability} onChange={(event) => setFilters({ ...filters, availability: event.target.value })}>
              <option value="">All availability</option>
              <option value="available">Available</option>
              <option value="expired">Expired or no expiration</option>
            </select>
            <input type="date" className={inputClass()} value={filters.createdAt} onChange={(event) => setFilters({ ...filters, createdAt: event.target.value })} />
            <input type="date" className={inputClass()} value={filters.expiresAt} onChange={(event) => setFilters({ ...filters, expiresAt: event.target.value })} />
            <input className={inputClass()} placeholder="Category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} />
            <select className={inputClass()} value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
              {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#6f7f4f]">{loading ? "Loading replays" : `${replays.length} replays`}</p>
              <button type="button" onClick={loadReplays} className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-black">Refresh</button>
            </div>
            <div className="grid gap-3">
              {replays.map((replay) => (
                <button key={replay.id} type="button" onClick={() => choose(replay)} className={`rounded-2xl p-4 text-left ${selected?.id === replay.id ? "bg-[#edf2dd]" : "bg-[#f3ecdc]"}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black">{replay.title}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#675f50]">
                        Created {dateLabel(replay.replay.availableFrom)} · Expires {replay.replay.expiresAt ? dateLabel(replay.replay.expiresAt) : "No expiration"} · {replay.replayViews} views
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#766e5e]">{replay.category} · {visibilityLabel(replay)}</p>
                    </div>
                    <span className="h-fit rounded-full bg-[#1f251a] px-3 py-1 text-xs font-black text-[#fffaf0]">{label(replay.replay.status)}</span>
                  </div>
                </button>
              ))}
              {!loading && !replays.length && <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">No service replays match the current filters.</p>}
            </div>
          </section>

          <aside className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            {selected ? (
              <div>
                <p className="text-sm font-semibold text-[#6f7f4f]">Replay details</p>
                <h2 className="mt-2 text-2xl font-semibold">{selected.title}</h2>
                <div className="mt-4 grid gap-2 text-sm">
                  <Detail label="Live title" value={selected.title} />
                  <Detail label="Creation date" value={dateLabel(selected.replay.availableFrom)} />
                  <Detail label="Expiration" value={selected.replay.expiresAt ? dateLabel(selected.replay.expiresAt) : "No expiration"} />
                  <Detail label="Replay status" value={label(selected.replay.status)} />
                  <Detail label="Views" value={`${selected.replayViews}`} />
                  <Detail label="Visibility" value={visibilityLabel(selected)} />
                </div>

                <form onSubmit={submitExpiration} className="mt-5 grid gap-3">
                  <p className="text-sm font-semibold text-[#6f7f4f]">New expiration date</p>
                  <input type="date" className={inputClass()} value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} />
                  {fields.expirationDate && <p className="text-sm font-semibold text-[#8c3f2b]">{fields.expirationDate}</p>}
                  <button type="submit" disabled={pending} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
                    {pending ? "Updating..." : "Extend replay availability"}
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Action disabled={pending} label="Remove expiration" onClick={() => updateReplay({ removeExpiration: true })} />
                  <Action disabled={pending} label="Activate visibility" onClick={() => updateReplay({ visibility: "public" })} />
                  <Action disabled={pending} label="Deactivate visibility" onClick={() => updateReplay({ visibility: "private" })} />
                </div>
                {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${message.includes("updated") ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>{message}</p>}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">Select a replay to view details and update availability.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f3ecdc] px-4 py-3">
      <span className="font-bold text-[#596540]">{label}</span>
      <span className="text-right font-semibold text-[#675f50]">{value}</span>
    </div>
  );
}

function Action({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-black disabled:opacity-60">{label}</button>;
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US");
}

function visibilityLabel(replay: LiveEvent) {
  const schedule = (replay.commerceData as { schedule?: { visibility?: string } } | undefined)?.schedule;
  return schedule?.visibility === "private" ? "Private" : "Public";
}
