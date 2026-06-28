import type { Metadata } from "next";
import Link from "next/link";
import { listLives } from "@/lib/backend/live-service";
import type { LiveEvent } from "@/lib/backend/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const categories = ["Rooms", "Hotel", "Restaurant", "Food & Brunch", "Spa", "Facilities", "Services", "Experiences", "Other"];
const providerRoles = [
  ["supplier", "Supplier"],
  ["hotel", "Hotel"],
  ["restaurant", "Restaurant"],
  ["service_provider", "Service Provider"],
] as const;
const statuses = [
  ["scheduled", "Scheduled"],
  ["active", "Live"],
  ["completed", "Completed"],
  ["replay", "Replay"],
  ["expired", "Expired"],
] as const;
const replayStatuses = [
  ["active", "Replay active"],
  ["expiring_soon", "Expiring soon"],
  ["expired", "Replay expired"],
] as const;
const sortOptions = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["most_viewed", "Most viewed"],
] as const;

export const metadata: Metadata = {
  title: "Live Catalogue",
  description: "Browse all Buyamia live streams and replays with filters and compact rows.",
};

export default async function LiveCataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const values = normalizeValues(params);
  const result = await listLives({
    page: values.page,
    pageSize: "12",
    search: values.search,
    status: values.status,
    category: values.category,
    providerRole: values.providerRole,
    pinned: values.pinned,
    replayStatus: values.replayStatus,
    dateFrom: values.date ? startOfDay(values.date).toISOString() : undefined,
    dateTo: values.date ? endOfDay(values.date).toISOString() : undefined,
    sort: sortForBackend(values.sort),
  });

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/live" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to live room
          </Link>
          <Link href="/live/calendar" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            View calendar
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Live catalogue</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl leading-tight sm:text-5xl">All live streams and replays</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#675f50]">
                Compact browsing for scheduled streams, active lives, completed rooms, and replay availability.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
              {result.pagination.totalItems} results
            </span>
          </div>
        </section>

        <form action="/live/catalogue" className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-bold text-[#596540]">
              Search
              <input name="search" defaultValue={values.search} placeholder="Title or provider" className={inputClass()} />
            </label>
            <Select name="category" label="Category" value={values.category} options={categories.map((item) => [item, item] as const)} allLabel="All categories" />
            <Select name="providerRole" label="Provider type" value={values.providerRole} options={providerRoles} allLabel="All providers" />
            <Select name="status" label="Live status" value={values.status} options={statuses} allLabel="All statuses" />
            <Select name="replayStatus" label="Replay status" value={values.replayStatus} options={replayStatuses} allLabel="All replays" />
            <Select name="sort" label="Sort" value={values.sort} options={sortOptions} />
            <label className="grid gap-2 text-sm font-bold text-[#596540]">
              Date
              <input name="date" type="date" defaultValue={values.date} className={inputClass()} />
            </label>
            <div className="grid content-end">
              <button type="submit" className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">
                Apply filters
              </button>
            </div>
          </div>
          <input type="hidden" name="page" value="1" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/live/catalogue" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold">
              Clear filters
            </Link>
          </div>
        </form>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm">
          <div className="grid gap-3">
            {result.items.length ? result.items.map((live) => <CatalogueRow key={live.id} live={live} />) : (
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
                No lives match these filters.
              </p>
            )}
          </div>
          <Pagination values={values} page={result.pagination.page} totalPages={result.pagination.totalPages} />
        </section>
      </div>
    </main>
  );
}

function CatalogueRow({ live }: { live: LiveEvent }) {
  return (
    <article className="grid gap-3 rounded-2xl bg-[#f3ecdc] p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#596540]">{formatLabel(live.status)}</span>
          <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{live.category}</span>
          {live.isPinned ? <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">Featured</span> : null}
        </div>
        <h2 className="mt-2 text-lg font-semibold">{live.title}</h2>
        <p className="mt-1 text-sm font-semibold text-[#675f50]">
          {live.providerName} - {formatLabel(live.providerRole)} - {formatDate(live.startsAt)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <span className="rounded-full bg-[#1f251a] px-3 py-2 text-xs font-black text-[#fffaf0]">Trust {live.trustScore.score}</span>
        <span className="rounded-full bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#596540]">{live.viewerCount + live.replayViews} views</span>
        <span className="rounded-full bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#596540]">Replay {live.replay.status.replace(/_/g, " ")}</span>
        <Link href={`/live/${live.id}`} className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
          Open
        </Link>
      </div>
    </article>
  );
}

function Select({
  name,
  label,
  value,
  options,
  allLabel,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  allLabel?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {label}
      <select name={name} defaultValue={value} className={inputClass()}>
        {allLabel ? <option value="">{allLabel}</option> : null}
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Pagination({ values, page, totalPages }: { values: CatalogueValues; page: number; totalPages: number }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-[#675f50]">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <Link href={pageHref(values, Math.max(1, page - 1))} aria-disabled={page <= 1} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-50">
          Previous
        </Link>
        <Link href={pageHref(values, Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-50">
          Next
        </Link>
      </div>
    </div>
  );
}

type CatalogueValues = {
  page: string;
  search: string;
  category: string;
  providerRole: string;
  status: string;
  pinned: string;
  replayStatus: string;
  sort: string;
  date: string;
};

function normalizeValues(params: Awaited<SearchParams>): CatalogueValues {
  const status = normalizeStatus(value(params.status));
  return {
    page: value(params.page) ?? "1",
    search: value(params.search) ?? "",
    category: value(params.category) ?? "",
    providerRole: value(params.providerRole) ?? "",
    status: status.status,
    pinned: status.pinned,
    replayStatus: value(params.replayStatus) ?? "",
    sort: value(params.sort) ?? "featured",
    date: value(params.date) ?? "",
  };
}

function normalizeStatus(input?: string) {
  if (input === "replays") return { status: "replay", pinned: "" };
  if (input === "live_now") return { status: "active", pinned: "" };
  if (input === "pinned") return { status: "", pinned: "true" };
  return { status: input ?? "", pinned: "" };
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function sortForBackend(sort: string) {
  if (sort === "oldest") return "scheduled_asc";
  if (sort === "newest") return "scheduled_desc";
  if (sort === "most_viewed") return "most_viewed";
  return "featured";
}

function pageHref(values: CatalogueValues, page: number) {
  const params = new URLSearchParams();
  for (const key of ["search", "category", "providerRole", "status", "replayStatus", "sort", "date"] as const) {
    if (values[key]) params.set(key, values[key]);
  }
  if (values.pinned) params.set("status", "pinned");
  params.set("page", String(page));
  return `/live/catalogue?${params.toString()}`;
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function startOfDay(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: string) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
