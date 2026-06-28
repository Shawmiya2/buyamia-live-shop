"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Provider } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

type SubscriptionPayload = {
  viewerUserId: string;
  followedProviders: Provider[];
  availableProviders: Provider[];
};

const providerTypes = [
  ["", "All types"],
  ["hotel", "Hotel"],
  ["restaurant", "Restaurant"],
  ["supplier", "Supplier"],
  ["service_provider", "Service Provider"],
] as const;

const sortOptions = [
  ["name", "Alphabetical"],
  ["trust", "Highest trust"],
  ["type", "Provider type"],
] as const;

export default function ViewerSubscriptionsPage() {
  const [viewerUserId, setViewerUserId] = useState("");
  const [followed, setFollowed] = useState<Provider[]>([]);
  const [available, setAvailable] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [providerType, setProviderType] = useState("");
  const [sort, setSort] = useState("name");
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/viewer", { cache: "no-store" });
      const payload = (await response.json()) as ApiEnvelope<SubscriptionPayload>;
      if (!payload.success) throw new Error(payload.error.message);
      setViewerUserId(payload.data.viewerUserId);
      setFollowed(payload.data.followedProviders);
      setAvailable(payload.data.availableProviders);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load subscriptions.");
    } finally {
      setLoading(false);
    }
  }

  const filteredFollowed = useMemo(() => filterProviders(followed, search, providerType, sort), [followed, search, providerType, sort]);
  const filteredAvailable = useMemo(() => filterProviders(available, search, providerType, sort), [available, search, providerType, sort]);

  async function toggleFollow(providerId: string, action: "follow" | "unfollow") {
    setPending(providerId);
    setMessage("");
    try {
      const response = await fetch("/api/subscriptions/follow", {
        method: action === "follow" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!payload.success) throw new Error(payload.error.message);
      await loadSubscriptions();
      setMessage(action === "follow" ? "Provider followed." : "Provider unfollowed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update subscription.");
    } finally {
      setPending("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/viewer" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to viewer dashboard
          </Link>
          <Link href="/live/catalogue" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            View live catalogue
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Viewer subscriptions</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">Manage followed providers</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Search, filter, follow, and unfollow providers from one full subscription workspace.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <input className={inputClass()} placeholder="Search providers" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className={inputClass()} value={providerType} onChange={(event) => setProviderType(event.target.value)}>
              {providerTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className={inputClass()} value={sort} onChange={(event) => setSort(event.target.value)}>
              {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" onClick={loadSubscriptions} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">
              Refresh
            </button>
          </div>
          {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${message.includes("Unable") ? "bg-[#fff3ed] text-[#8c3f2b]" : "bg-[#edf2dd] text-[#596540]"}`}>{message}</p>}
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ProviderManagement
            id="following"
            title="All followed providers"
            badge={loading ? "Loading" : `${filteredFollowed.length}`}
            providers={filteredFollowed}
            empty="No followed providers match these filters."
            actionLabel="Unfollow"
            pending={pending}
            onAction={(providerId) => toggleFollow(providerId, "unfollow")}
          />
          <ProviderManagement
            id="providers"
            title="All available providers"
            badge={loading ? "Loading" : `${filteredAvailable.length}`}
            providers={filteredAvailable}
            empty="No available providers match these filters."
            actionLabel="Follow"
            pending={pending}
            onAction={(providerId) => toggleFollow(providerId, "follow")}
          />
        </div>

        {viewerUserId && <p className="mt-5 text-xs font-semibold text-[#675f50]">Viewer account: {viewerUserId}</p>}
      </div>
    </main>
  );
}

function ProviderManagement({
  id,
  title,
  badge,
  providers,
  empty,
  actionLabel,
  pending,
  onAction,
}: {
  id: string;
  title: string;
  badge: string;
  providers: Provider[];
  empty: string;
  actionLabel: string;
  pending: string;
  onAction: (providerId: string) => void;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{badge}</span>
      </div>
      <div className="mt-4 grid gap-3">
        {providers.length ? providers.map((provider) => (
          <article key={provider.id} className="grid gap-3 rounded-2xl bg-[#f3ecdc] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm font-black">{provider.name}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-[#675f50]">
                <span>{formatLabel(provider.profileType)}</span>
                <span>{formatLabel(provider.verificationStatus)}</span>
                <span>Trust {provider.trustScore ?? "n/a"}</span>
              </div>
            </div>
            <button type="button" disabled={pending === provider.id} onClick={() => onAction(provider.id)} className="rounded-full bg-[#1f251a] px-4 py-2 text-xs font-black text-[#fffaf0] disabled:opacity-60">
              {pending === provider.id ? "Updating..." : actionLabel}
            </button>
          </article>
        )) : (
          <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">{empty}</p>
        )}
      </div>
    </section>
  );
}

function filterProviders(providers: Provider[], search: string, providerType: string, sort: string) {
  const query = search.trim().toLowerCase();
  return providers
    .filter((provider) => !query || provider.name.toLowerCase().includes(query))
    .filter((provider) => !providerType || provider.profileType === providerType)
    .sort((a, b) => {
      if (sort === "trust") return (b.trustScore ?? 0) - (a.trustScore ?? 0);
      if (sort === "type") return a.profileType.localeCompare(b.profileType) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
