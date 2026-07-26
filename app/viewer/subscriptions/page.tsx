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
  ["recent", "Recently added"],
  ["oldest", "Oldest"],
  ["name", "Alphabetical"],
  ["trust", "Trust score"],
  ["availability", "Availability"],
  ["category", "Category"],
] as const;

export default function ViewerSubscriptionsPage() {
  const [viewerUserId, setViewerUserId] = useState("");
  const [followed, setFollowed] = useState<Provider[]>([]);
  const [available, setAvailable] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [providerType, setProviderType] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [provider, setProvider] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("recent");
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

  const allProviders = [...followed, ...available];
  const countries = unique(allProviders.flatMap((item) => item.country ? [item.country] : []));
  const cities = unique(allProviders.flatMap((item) => item.city ? [item.city] : []));
  const providerNames = unique(allProviders.map((item) => item.name));
  const filters = { search, providerType, country, city, provider, availability, sort };
  const filteredFollowed = useMemo(() => filterProviders(followed, filters), [followed, search, providerType, country, city, provider, availability, sort]);
  const filteredAvailable = useMemo(() => filterProviders(available, filters), [available, search, providerType, country, city, provider, availability, sort]);

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
      setMessage(action === "follow" ? "Item added to your wishlist." : "Item removed from your wishlist.");
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
          <Link href="/dashboard/viewer/concierge" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Buyer concierge
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Viewer wishlist</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">Update wishlist</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Save hotels, restaurants, suppliers, and services, then manage them from one compact workspace.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input className={inputClass()} placeholder="Search providers" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className={inputClass()} value={providerType} onChange={(event) => setProviderType(event.target.value)}>
              {providerTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <Filter value={country} onChange={setCountry} label="All countries" options={countries} />
            <Filter value={city} onChange={setCity} label="All cities" options={cities} />
            <Filter value={provider} onChange={setProvider} label="All providers" options={providerNames} />
            <select className={inputClass()} value={availability} onChange={(event) => setAvailability(event.target.value)}>
              <option value="">All availability</option>
              <option value="live_now">Live now</option>
              <option value="available">Upcoming live</option>
              <option value="replay_available">Replay available</option>
              <option value="no_active_sessions">No active sessions</option>
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
            title="Wishlist items"
            badge={loading ? "Loading" : `${filteredFollowed.length}`}
            providers={filteredFollowed}
            empty="No wishlist items match these filters."
            actionLabel="Remove"
            pending={pending}
            onAction={(providerId) => toggleFollow(providerId, "unfollow")}
          />
          <ProviderManagement
            id="providers"
            title="Add to wishlist"
            badge={loading ? "Loading" : `${Math.min(filteredAvailable.length, 5)} of ${filteredAvailable.length}`}
            providers={filteredAvailable.slice(0, 5)}
            empty="No available providers match these filters."
            actionLabel="Add"
            pending={pending}
            onAction={(providerId) => toggleFollow(providerId, "follow")}
            compact
            footer={(
              <Link href="#following" className="inline-flex rounded-full bg-[#596540] px-4 py-2 text-xs font-black text-[#fffaf0]">
                View All Wishlist
              </Link>
            )}
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
  compact = false,
  footer,
}: {
  id: string;
  title: string;
  badge: string;
  providers: Provider[];
  empty: string;
  actionLabel: string;
  pending: string;
  onAction: (providerId: string) => void;
  compact?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{badge}</span>
      </div>
      <div className={`mt-4 grid ${compact ? "gap-1.5" : "gap-3"}`}>
        {providers.length ? providers.map((provider) => (
          <article key={provider.id} className={`grid items-center bg-[#f3ecdc] sm:grid-cols-[1fr_auto] ${compact ? "gap-2 rounded-xl px-3 py-2" : "gap-3 rounded-2xl p-4"}`}>
            <div>
              <p className="text-sm font-black">{provider.name}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-[#675f50]">
                <span>{formatLabel(provider.profileType)}</span>
                <span>Trust {provider.trustScore ?? "n/a"}</span>
                {compact ? <span>{formatLabel(provider.currentAvailability ?? "no_active_sessions")}</span> : <span>{formatLabel(provider.verificationStatus)}</span>}
              </div>
              {!compact ? (
                <>
                  <p className="mt-2 text-xs font-semibold text-[#675f50]">
                    {[provider.city, provider.country].filter(Boolean).join(", ") || "Location not listed"} · {formatLabel(provider.currentAvailability ?? "no_active_sessions")}
                  </p>
                  {provider.addedAt ? <p className="mt-1 text-xs text-[#766e5e]">Added {new Date(provider.addedAt).toLocaleDateString()}</p> : null}
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {!compact ? <Link href={`/live/catalogue?search=${encodeURIComponent(provider.name)}`} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-black">Open details</Link> : null}
              <button type="button" disabled={pending === provider.id} onClick={() => onAction(provider.id)} className="rounded-full bg-[#1f251a] px-4 py-2 text-xs font-black text-[#fffaf0] disabled:opacity-60">
                {pending === provider.id ? "Updating..." : actionLabel}
              </button>
            </div>
          </article>
        )) : (
          <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">{empty}</p>
        )}
      </div>
      {footer ? <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#d6cbb6] pt-4"><p className="text-xs font-semibold text-[#675f50]">Showing the first 5 matches.</p>{footer}</div> : null}
    </section>
  );
}

function filterProviders(providers: Provider[], filters: {
  search: string;
  providerType: string;
  country: string;
  city: string;
  provider: string;
  availability: string;
  sort: string;
}) {
  const query = filters.search.trim().toLowerCase();
  return providers
    .filter((provider) => !query || provider.name.toLowerCase().includes(query))
    .filter((provider) => !filters.providerType || provider.profileType === filters.providerType)
    .filter((provider) => !filters.country || provider.country === filters.country)
    .filter((provider) => !filters.city || provider.city === filters.city)
    .filter((provider) => !filters.provider || provider.name === filters.provider)
    .filter((provider) => !filters.availability || provider.currentAvailability === filters.availability)
    .sort((a, b) => {
      if (filters.sort === "trust") return (b.trustScore ?? 0) - (a.trustScore ?? 0);
      if (filters.sort === "availability") return availabilityRank(a.currentAvailability) - availabilityRank(b.currentAvailability) || a.name.localeCompare(b.name);
      if (filters.sort === "category") return a.profileType.localeCompare(b.profileType) || a.name.localeCompare(b.name);
      if (filters.sort === "oldest") return new Date(a.addedAt ?? 0).getTime() - new Date(b.addedAt ?? 0).getTime();
      if (filters.sort === "recent") return new Date(b.addedAt ?? 0).getTime() - new Date(a.addedAt ?? 0).getTime();
      return a.name.localeCompare(b.name);
    });
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) {
  return (
    <select className={inputClass()} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function unique(values: string[]) {
  return [...new Set(values)].sort();
}

function availabilityRank(value?: Provider["currentAvailability"]) {
  return ["live_now", "available", "replay_available", "no_active_sessions"].indexOf(value ?? "no_active_sessions");
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
