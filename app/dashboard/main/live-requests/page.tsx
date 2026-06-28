import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/backend/auth-context";
import { listLiveRequestCatalogue, listLiveRequestCategories } from "@/lib/backend/live-request-service";
import type { ServiceLiveSetupRequest } from "@/lib/backend/types";
import { LiveRequestCatalogueActions } from "./live-request-catalogue-actions";

export const metadata: Metadata = {
  title: "Live Request Catalogue",
  description: "Main admin live request review catalogue with server-side filters.",
};

const statuses = [
  ["draft", "Draft"],
  ["pending_review", "Pending review"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["scheduled", "Scheduled"],
  ["active", "Active"],
  ["completed", "Completed"],
] as const;

const providerRoles = [
  ["hotel", "Hotel"],
  ["restaurant", "Restaurant"],
  ["supplier", "Supplier"],
  ["service_provider", "Service provider"],
] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MainLiveRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("main_admin");
  const params = await searchParams;
  const result = await listLiveRequestCatalogue({
    page: value(params.page),
    pageSize: value(params.pageSize) ?? "10",
    search: value(params.search),
    status: value(params.status),
    providerRole: value(params.providerRole),
    category: value(params.category),
  });
  const categories = await listLiveRequestCategories();
  const filterValues = {
    search: value(params.search) ?? "",
    status: value(params.status) ?? "",
    providerRole: value(params.providerRole) ?? "",
    category: value(params.category) ?? "",
  };

  return (
    <main className="min-h-dvh bg-[#f3ecdc] text-[#1e2419]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Main admin</p>
              <h1 className="mt-1 font-serif text-4xl leading-tight">Live request catalogue</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#675f50]">
                Review provider live requests with searchable, filtered server-side data before approval, scheduling, or follow-up.
              </p>
            </div>
            <Link href="/dashboard/main" className="w-fit rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
              Back to main dashboard
            </Link>
          </div>
        </div>

        <FilterToolbar values={filterValues} categories={categories} />

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Live request results</p>
              <h2 className="mt-1 text-xl font-semibold">{result.pagination.totalItems} total requests</h2>
            </div>
            <p className="text-sm font-semibold text-[#675f50]">
              Page {result.pagination.page} of {result.pagination.totalPages} - {result.pagination.pageSize} per page
            </p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {result.items.length ? (
              result.items.map((request) => <LiveRequestCard key={request.id} request={request} />)
            ) : (
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
                No live requests match the current filters. Clear filters or try a different search.
              </p>
            )}
          </div>

          <Pagination query={params} page={result.pagination.page} totalPages={result.pagination.totalPages} totalItems={result.pagination.totalItems} hasPreviousPage={result.pagination.hasPreviousPage} hasNextPage={result.pagination.hasNextPage} />
        </section>
      </section>
    </main>
  );
}

function FilterToolbar({ values, categories }: { values: Record<string, string>; categories: string[] }) {
  return (
    <form action="/dashboard/main/live-requests" className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold text-[#596540]">
          Search
          <input name="search" defaultValue={values.search} placeholder="Request title or provider name" className={inputClass()} />
        </label>
        <Select name="status" label="Status" value={values.status} options={statuses} allLabel="All" />
        <Select name="providerRole" label="Provider role" value={values.providerRole} options={providerRoles} allLabel="All" />
        <Select name="category" label="Category" value={values.category} options={categories.map((category) => [category, category] as const)} allLabel="All" />
      </div>
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="pageSize" value="10" />
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
          Apply filters
        </button>
        <Link href="/dashboard/main/live-requests" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1e2419]">
          Clear filters
        </Link>
      </div>
    </form>
  );
}

function LiveRequestCard({ request }: { request: ServiceLiveSetupRequest }) {
  const providerName = request.provider?.displayName || request.provider?.user.name || "Provider";
  const providerRole = request.provider?.user.role ?? request.provider?.category ?? "service_provider";

  return (
    <article className="rounded-2xl bg-[#f3ecdc] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{request.category}</p>
          <h3 className="mt-2 text-lg font-semibold">{request.title}</h3>
          <p className="mt-1 text-sm font-semibold text-[#675f50]">
            {providerName} - {formatLabel(providerRole)}
          </p>
        </div>
        <Badge>{formatLabel(request.status)}</Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Provider name" value={providerName} />
        <Detail label="Provider role" value={formatLabel(providerRole)} />
        <Detail label="Category" value={request.category} />
        <Detail label="Preferred date" value={formatDate(request.preferredDate)} />
        <Detail label="Status" value={formatLabel(request.status)} />
        <Detail label="Created date" value={formatDate(request.createdAt)} />
        <Detail label="Admin note" value={request.adminNote || "None"} />
      </dl>
      <LiveRequestCatalogueActions requestId={request.id} status={request.status} />
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
    <nav className="mt-5 flex flex-col gap-3 border-t border-[#d6cbb6] pt-4 text-sm font-bold sm:flex-row sm:items-center sm:justify-between" aria-label="Live request pagination">
      <p className="text-[#675f50]">Showing page {page} of {totalPages} for {totalItems} requests</p>
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
  return `/dashboard/main/live-requests?${next.toString()}`;
}

function pageNumbers(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none";
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}
