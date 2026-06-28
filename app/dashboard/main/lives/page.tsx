import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminAccessDenied } from "@/app/admin-access-denied";
import { getCurrentUser, requireRole } from "@/lib/backend/auth-context";
import { listLives } from "@/lib/backend/live-service";
import type { LiveEvent } from "@/lib/backend/types";
import { LiveAdminActions } from "./live-admin-actions";

export const metadata: Metadata = {
  title: "Manage Lives",
  description: "Main admin live controls with server-side pagination and filtering.",
};

const categories = ["Rooms", "Hotel", "Restaurant", "Food & Brunch", "Spa", "Facilities", "Services", "Experiences", "Other"];
const statuses = [
  ["scheduled", "Scheduled"],
  ["active", "Active"],
  ["completed", "Completed"],
  ["replay", "Replay"],
  ["expired", "Expired"],
] as const;
const providerRoles = [
  ["hotel", "Hotel"],
  ["restaurant", "Restaurant"],
  ["supplier", "Supplier"],
  ["service_provider", "Service Provider"],
] as const;
const pinReasons = [
  ["sponsored", "Sponsored"],
  ["nearby", "Nearby"],
  ["most_watched", "Most watched"],
  ["featured_by_buyamia", "Featured by Buyamia"],
] as const;
const replayStatuses = [
  ["active", "Active"],
  ["expiring_soon", "Expiring soon"],
  ["expired", "Expired"],
] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MainLivesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (user?.role !== "main_admin") {
    return <AdminAccessDenied user={user} />;
  }
  await requireRole("main_admin");
  const params = await searchParams;
  const result = await listLives({
    page: value(params.page),
    pageSize: value(params.pageSize) ?? "10",
    search: value(params.search),
    status: value(params.status),
    category: value(params.category),
    providerRole: value(params.providerRole),
    providerId: value(params.providerId),
    pinned: value(params.pinned),
    pinReason: value(params.pinReason),
    replayStatus: value(params.replayStatus),
    sort: value(params.sort),
  });
  const filterValues = {
    search: value(params.search) ?? "",
    status: value(params.status) ?? "",
    category: value(params.category) ?? "",
    providerRole: value(params.providerRole) ?? "",
    providerId: value(params.providerId) ?? "",
    pinned: value(params.pinned) ?? "",
    pinReason: value(params.pinReason) ?? "",
    replayStatus: value(params.replayStatus) ?? "",
    sort: value(params.sort) ?? "important",
  };

  return (
    <main className="min-h-dvh bg-[#f3ecdc] text-[#1e2419]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Main admin</p>
              <h1 className="mt-1 font-serif text-4xl leading-tight">Backend live controls</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#675f50]">
                Server-side live pagination, filtering, pinning, and replay expiration controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
                {result.activePinnedCount} active pins
              </span>
              <Link href="/dashboard/main" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
                Back to main dashboard
              </Link>
            </div>
          </div>
        </div>

        <FilterToolbar values={filterValues} />

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Live results</p>
              <h2 className="mt-1 text-xl font-semibold">{result.pagination.totalItems} total results</h2>
            </div>
            <p className="text-sm font-semibold text-[#675f50]">
              Page {result.pagination.page} of {result.pagination.totalPages} - {result.pagination.pageSize} per page
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {result.items.length ? (
              result.items.map((live, index) => <LiveAdminCard key={`${live.id}-admin-${index}`} live={live} />)
            ) : (
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
                No lives match the current filters.
              </p>
            )}
          </div>
          <Pagination query={params} page={result.pagination.page} totalPages={result.pagination.totalPages} totalItems={result.pagination.totalItems} hasPreviousPage={result.pagination.hasPreviousPage} hasNextPage={result.pagination.hasNextPage} />
        </section>
      </section>
    </main>
  );
}

function FilterToolbar({ values }: { values: Record<string, string> }) {
  return (
    <form action="/dashboard/main/lives" className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold text-[#596540]">
          Search
          <input name="search" defaultValue={values.search} placeholder="Live title or provider name" className={inputClass()} />
        </label>
        <Select name="status" label="Status" value={values.status} options={statuses} allLabel="All" />
        <Select name="category" label="Category" value={values.category} options={categories.map((item) => [item, item] as const)} allLabel="All" />
        <Select name="providerRole" label="Provider role" value={values.providerRole} options={providerRoles} allLabel="All" />
        <Select name="pinned" label="Pinned state" value={values.pinned} options={[["pinned", "Pinned"], ["not_pinned", "Not pinned"]]} allLabel="All" />
        <Select name="pinReason" label="Pin reason" value={values.pinReason} options={pinReasons} allLabel="All" />
        <Select name="replayStatus" label="Replay status" value={values.replayStatus} options={replayStatuses} allLabel="All" />
        <Select name="sort" label="Sort" value={values.sort} options={[["important", "Important"], ["scheduled_desc", "Scheduled newest"], ["scheduled_asc", "Scheduled oldest"], ["title_asc", "Title"], ["provider_asc", "Provider"], ["replay_expiring", "Replay expiring"]]} />
      </div>
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="pageSize" value="10" />
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
          Apply filters
        </button>
        <Link href="/dashboard/main/lives" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1e2419]">
          Clear filters
        </Link>
      </div>
    </form>
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
        {allLabel && <option value="">{allLabel}</option>}
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function LiveAdminCard({ live }: { live: LiveEvent }) {
  return (
    <article className="rounded-2xl bg-[#f3ecdc] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{live.title}</h3>
          <p className="mt-1 text-sm font-semibold text-[#675f50]">
            {live.providerName} - {formatLabel(live.providerRole)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{formatLabel(live.status)}</Badge>
          <Badge>{live.category}</Badge>
          <Badge>{live.isPinned ? `Pinned: ${formatLabel(live.pinReason ?? "featured_by_buyamia")}` : "Not pinned"}</Badge>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Scheduled date" value={formatDate(live.startsAt)} />
        <Detail label="Viewer count" value={formatNumber(live.viewerCount)} />
        <Detail label="Replay views" value={formatNumber(live.replayViews)} />
        <Detail label="Conversion intent" value={`${live.conversionIntent}%`} />
        <Detail label="Supplier trust" value={`${live.trustScore.score}/100`} />
        <Detail label="Replay expiration" value={replayExpirationLabel(live)} />
        <Detail label="Pinned state" value={live.isPinned ? "Pinned" : "Not pinned"} />
        <Detail label="Pin reason" value={live.pinReason ? formatLabel(live.pinReason) : "None"} />
        <Detail label="Provider role" value={formatLabel(live.providerRole)} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/dashboard/main/lives/${live.id}`} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#1e2419]">
          Details
        </Link>
      </div>
      <LiveAdminActions live={live} />
    </article>
  );
}

function Pagination({
  query,
  page,
  totalPages,
  totalItems,
  hasPreviousPage,
  hasNextPage,
}: {
  query: Record<string, string | string[] | undefined>;
  page: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}) {
  const pages = pageNumbers(page, totalPages);
  return (
    <nav className="mt-5 flex flex-col gap-3 border-t border-[#d6cbb6] pt-4 text-sm font-bold sm:flex-row sm:items-center sm:justify-between" aria-label="Live pagination">
      <p className="text-[#675f50]">Showing page {page} of {totalPages} for {totalItems} results</p>
      <div className="flex flex-wrap gap-2">
        <PageLink disabled={!hasPreviousPage} href={pageHref(query, 1)}>First</PageLink>
        <PageLink disabled={!hasPreviousPage} href={pageHref(query, Math.max(1, page - 1))}>Previous</PageLink>
        {pages.map((pageNumber) => (
          <PageLink key={pageNumber} active={pageNumber === page} href={pageHref(query, pageNumber)}>
            {pageNumber}
          </PageLink>
        ))}
        <PageLink disabled={!hasNextPage} href={pageHref(query, Math.min(totalPages, page + 1))}>Next</PageLink>
        <PageLink disabled={!hasNextPage} href={pageHref(query, totalPages)}>Last</PageLink>
      </div>
    </nav>
  );
}

function PageLink({ href, disabled, active, children }: { href: string; disabled?: boolean; active?: boolean; children: ReactNode }) {
  if (disabled) {
    return <span aria-disabled="true" className="rounded-full border border-[#ded4c2] px-3 py-2 text-[#9b927f]">{children}</span>;
  }

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full border px-3 py-2 ${active ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]" : "border-[#cabda4] bg-[#fffaf0] text-[#1e2419]"}`}>
      {children}
    </Link>
  );
}

function pageHref(query: Record<string, string | string[] | undefined>, page: number) {
  const next = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    const current = value(rawValue);
    if (current && key !== "page") {
      next.set(key, current);
    }
  }
  next.set("page", String(page));
  if (!next.get("pageSize")) {
    next.set("pageSize", "10");
  }
  return `/dashboard/main/lives?${next.toString()}`;
}

function pageNumbers(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fffaf0] p-3">
      <dt className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#1e2419]">{value}</dd>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{children}</span>;
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none";
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
