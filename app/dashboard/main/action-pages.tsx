"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardAccessGate } from "../../dashboard-access-gate";
import { CurrencyEstimatePanel } from "@/app/live/currency-estimate-panel";
import type { SupplierTrustScore } from "@/lib/backend/types";

type Envelope<T> = { success: true; data: T } | { success: false; error: { message: string; fields?: Record<string, string> } };
type Rfq = {
  id: string;
  title: string;
  category: string;
  requirements: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  deadline: string;
  supplierType?: string | null;
  status: string;
  createdAt: string;
  negotiations?: { id: string; title: string; status: string; provider?: { displayName: string } | null }[];
};
type SupplierRank = {
  id: string;
  name: string;
  category: string;
  verificationStatus: string;
  location: string;
  description: string;
  followers: number;
  lives: number;
  replayViews: number;
  trustScore: SupplierTrustScore;
  detailHref: string;
};
type SupplierDetail = {
  id: string;
  displayName: string;
  category: string;
  location?: string | null;
  description?: string | null;
  completedOrders: number;
  responseRate: number;
  responseMinutes: number;
  bImpactScore: number;
  certifiedReviews: number;
  trustScore: SupplierTrustScore;
  user?: {
    verificationStatus: string;
  };
  followers?: unknown[];
  lives?: { id: string; title: string; status: string }[];
  liveRequests?: { id: string; title: string; status: string }[];
};
type Negotiation = {
  id: string;
  title: string;
  status: string;
  provider?: { displayName: string } | null;
  rfq?: { title: string } | null;
  messages: { id: string; body: string; createdAt: string; author: { name: string; role: string } }[];
  createdAt: string;
};
type RiskItem = {
  targetType: "provider" | "rfq";
  providerId: string;
  rfqId: string;
  title: string;
  role: string;
  verificationStatus: string;
  riskLevel: "low" | "medium" | "high";
  indicators: string[];
  reviewStatus: string;
  adminNote: string;
  detailHref: string;
};
type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  category: string;
  role: string;
  status: string;
  type: string;
  detailHref: string;
};

const roles = ["all", "hotel", "restaurant", "supplier", "service_provider"];
const verificationStatuses = ["all", "not_started", "pending", "verified", "rejected", "needs_more_info"];
const riskLevels = ["all", "low", "medium", "high"];
const riskStatuses = ["pending", "reviewed", "escalated", "dismissed"];
const negotiationStatuses = ["open", "awaiting_response", "paused", "closed"];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-[#8c3f2b]">{error}</span> : null}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-sm outline-none";
}

function Shell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <DashboardAccessGate dashboardType="main">
      <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">{eyebrow}</p>
              <h1 className="mt-1 font-serif text-3xl leading-tight">{title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/main" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">Main dashboard</Link>
              <Link href="/dashboard/main/rfqs" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">RFQs</Link>
              <Link href="/dashboard/main/calendar" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">Calendar</Link>
            </div>
          </div>
          {children}
        </div>
      </main>
    </DashboardAccessGate>
  );
}

async function api<T>(url: string, init?: RequestInit): Promise<Envelope<T>> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  return response.json();
}

export function RfqCreatePage() {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [createdRfq, setCreatedRfq] = useState<Rfq | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const formElement = event.currentTarget;
    setLoading(true);
    setMessage("");
    setCreatedRfq(null);
    setErrors({});
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const result = await api<Rfq>("/api/rfqs", { method: "POST", body: JSON.stringify(payload) });
      if (!result.success) {
        setErrors(result.error.fields ?? {});
        setMessage(result.error.message);
        return;
      }
      setFields({});
      formElement.reset();
      setCreatedRfq(result.data);
      setMessage(`RFQ created: ${result.data.title}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell title="Generate RFQ" eyebrow="Procurement quick action">
      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm lg:grid-cols-2">
        <Field label="Title" error={errors.title}><input name="title" className={inputClass()} value={fields.title ?? ""} onChange={(e) => setFields({ ...fields, title: e.target.value })} /></Field>
        <Field label="Category" error={errors.category}><input name="category" className={inputClass()} value={fields.category ?? ""} onChange={(e) => setFields({ ...fields, category: e.target.value })} /></Field>
        <Field label="Requirements" error={errors.requirements}><textarea name="requirements" rows={7} className={inputClass()} value={fields.requirements ?? ""} onChange={(e) => setFields({ ...fields, requirements: e.target.value })} /></Field>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget min" error={errors.budgetMin}><input name="budgetMin" type="number" min="0" className={inputClass()} /></Field>
            <Field label="Budget max" error={errors.budgetMax}><input name="budgetMax" type="number" min="0" className={inputClass()} /></Field>
          </div>
          <Field label="Deadline" error={errors.deadline}><input name="deadline" type="date" className={inputClass()} /></Field>
          <Field label="Supplier type" error={errors.supplierType}>
            <select name="supplierType" className={inputClass()}>
              <option value="">Any supplier type</option>
              {roles.filter((role) => role !== "all").map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}
            </select>
          </Field>
          <button type="submit" disabled={loading} className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
            {loading ? "Creating RFQ..." : "Create RFQ"}
          </button>
          {message ? (
            <div className="rounded-2xl bg-[#edf2dd] p-4 text-sm font-bold text-[#44512f]">
              <p>{message}</p>
              {createdRfq ? <Link href="/dashboard/main/rfqs" className="mt-3 inline-flex rounded-full border border-[#b8c98f] px-4 py-2">View all RFQs</Link> : null}
            </div>
          ) : null}
        </div>
      </form>
    </Shell>
  );
}

export function RfqListPage() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Rfq[]>("/api/rfqs").then((result) => result.success && setRfqs(result.data)).finally(() => setLoading(false));
  }, []);
  return (
    <Shell title="RFQs" eyebrow="Procurement workspace">
      <div className="mb-4"><Link href="/dashboard/main/rfqs/new" className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">Generate RFQ</Link></div>
      <div className="grid gap-3">
        {loading ? <p className="rounded-2xl bg-[#fffaf0] p-4 font-semibold">Loading RFQs...</p> : null}
        {!loading && rfqs.length === 0 ? <p className="rounded-2xl bg-[#fffaf0] p-4 font-semibold">No RFQs yet.</p> : null}
        {rfqs.map((rfq) => (
          <article key={rfq.id} className="grid gap-3 rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{rfq.title}</h2>
              <p className="mt-1 text-sm text-[#675f50]">{rfq.category} - deadline {formatDate(rfq.deadline)} - {formatLabel(rfq.status)}</p>
              <p className="mt-1 text-xs font-semibold text-[#6f7f4f]">Created {formatDate(rfq.createdAt)}</p>
            </div>
            <Link href={`/dashboard/main/rfqs/${rfq.id}`} className="h-fit rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">View details</Link>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function RfqDetailPage({ id }: { id: string }) {
  const [rfq, setRfq] = useState<Rfq | null>(null);
  useEffect(() => {
    api<Rfq>(`/api/rfqs/${id}`).then((result) => result.success && setRfq(result.data));
  }, [id]);
  return (
    <Shell title={rfq?.title ?? "RFQ details"} eyebrow="RFQ detail">
      {!rfq ? <p className="rounded-2xl bg-[#fffaf0] p-4 font-semibold">Loading RFQ...</p> : (
        <>
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5">
            <p className="text-sm font-bold text-[#6f7f4f]">{rfq.category} - {formatLabel(rfq.status)}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#675f50]">{rfq.requirements}</p>
            <p className="mt-4 text-sm font-semibold">Deadline: {formatDate(rfq.deadline)}</p>
            <Link href="/dashboard/main/negotiations" className="mt-5 inline-flex rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">Open negotiation workspace</Link>
          </section>
          <CurrencyEstimatePanel
            title="RFQ landed cost estimate"
            summaryLabel="This demo RFQ estimate uses a fixed IDR source snapshot and buyer-selected currency."
            sourceLabel={rfq.title}
            sourcePriceIdr={18600000}
            quantity={1}
            initialCurrency="USD"
          />
        </>
      )}
    </Shell>
  );
}

export function SupplierRankPage() {
  const [suppliers, setSuppliers] = useState<SupplierRank[]>([]);
  const [filters, setFilters] = useState({ search: "", category: "all", verification: "all", location: "all", sort: "verification" });
  useEffect(() => {
    const params = new URLSearchParams(filters);
    api<SupplierRank[]>(`/api/suppliers/rank?${params}`).then((result) => result.success && setSuppliers(result.data));
  }, [filters]);
  const locations = useMemo(() => ["all", ...Array.from(new Set(suppliers.map((item) => item.location).filter(Boolean)))], [suppliers]);
  return (
    <Shell title="Rank suppliers" eyebrow="Stored provider ranking">
      <div className="grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 md:grid-cols-5">
        <input aria-label="Search suppliers" className={inputClass()} placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select aria-label="Category filter" className={inputClass()} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>{roles.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}</select>
        <select aria-label="Verification filter" className={inputClass()} value={filters.verification} onChange={(e) => setFilters({ ...filters, verification: e.target.value })}>{verificationStatuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select>
        <select aria-label="Location filter" className={inputClass()} value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>{locations.map((location) => <option key={location} value={location}>{formatLabel(location)}</option>)}</select>
        <select aria-label="Sort suppliers" className={inputClass()} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>{["verification", "trustScore", "followers", "lives", "replayViews"].map((sort) => <option key={sort} value={sort}>{formatLabel(sort)}</option>)}</select>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {suppliers.map((supplier) => (
          <article key={supplier.id} className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-semibold">{supplier.name}</h2><p className="text-sm text-[#675f50]">{formatLabel(supplier.category)} - {supplier.location || "No location"}</p></div>
              <div className="flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-[#1e2419] px-3 py-1 text-xs font-bold text-[#fffaf0]">Trust {supplier.trustScore.score}</span>
                <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-bold">{formatLabel(supplier.verificationStatus)}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#675f50]">Followers {supplier.followers} - lives {supplier.lives} - replay views {supplier.replayViews} - {supplier.trustScore.label}</p>
            <Link href={supplier.detailHref} className="mt-4 inline-flex rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">Supplier details</Link>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function SupplierDetailPage({ id }: { id: string }) {
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  useEffect(() => {
    api<SupplierDetail>(`/api/suppliers/${id}`).then((result) => result.success && setSupplier(result.data));
  }, [id]);
  return (
    <Shell title={supplier?.displayName ?? "Supplier details"} eyebrow="Provider record">
      {supplier ? (
        <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#6f7f4f]">{formatLabel(supplier.category)} - {supplier.location || "No location"}</p>
                <h2 className="mt-2 text-2xl font-semibold">{supplier.trustScore.label}</h2>
                <p className="mt-3 text-sm leading-7 text-[#675f50]">{supplier.description || "Local supplier profile."}</p>
              </div>
              <div className="rounded-3xl bg-[#1e2419] px-6 py-5 text-center text-[#fffaf0]">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">Verified Trust Score</p>
                <p className="mt-2 text-5xl font-semibold">{supplier.trustScore.score}</p>
                <p className="mt-1 text-xs text-[#ded8ca]">out of 100</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <TrustStat label="Completed orders" value={String(supplier.trustScore.completedOrders)} />
              <TrustStat label="Response rate" value={`${supplier.trustScore.responseRate}%`} />
              <TrustStat label="Average response" value={`${supplier.trustScore.averageResponseMinutes} min`} />
              <TrustStat label="B-Impact score" value={String(supplier.trustScore.bImpactScore)} />
              <TrustStat label="Completed lives" value={String(supplier.trustScore.completedLiveSessions)} />
              <TrustStat label="Certified reviews" value={String(supplier.trustScore.certifiedReviews)} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {supplier.trustScore.certifications.map((certification) => (
                <span key={certification} className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-bold text-[#596540]">{certification}</span>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Trust breakdown</p>
            <h2 className="mt-1 text-xl font-semibold">Why this supplier has Trust {supplier.trustScore.score}</h2>
            <div className="mt-4 grid gap-3">
              {supplier.trustScore.breakdown.map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-[#675f50]">{item.value}</p>
                    </div>
                    <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#596540]">{item.points}/{item.maxPoints}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#675f50]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <p className="rounded-2xl bg-[#fffaf0] p-4 font-semibold">Loading supplier...</p>
      )}
    </Shell>
  );
}

function TrustStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#6f7f4f]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

export function NegotiationsPage({ selectedId }: { selectedId?: string }) {
  const [items, setItems] = useState<Negotiation[]>([]);
  const [selected, setSelected] = useState<Negotiation | null>(null);
  const [providers, setProviders] = useState<SupplierRank[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [message, setMessage] = useState("");
  async function refresh(id = selectedId) {
    const [negotiations, providerRows, rfqRows] = await Promise.all([api<Negotiation[]>("/api/negotiations"), api<SupplierRank[]>("/api/suppliers/rank"), api<Rfq[]>("/api/rfqs")]);
    if (negotiations.success) {
      setItems(negotiations.data);
      setSelected(negotiations.data.find((item) => item.id === id) ?? negotiations.data[0] ?? null);
    }
    if (providerRows.success) setProviders(providerRows.data);
    if (rfqRows.success) setRfqs(rfqRows.data);
  }
  useEffect(() => { refresh(); }, []);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const payload = Object.fromEntries(new FormData(formElement).entries());
    const result = await api<Negotiation>("/api/negotiations", { method: "POST", body: JSON.stringify(payload) });
    if (result.success) { setMessage("Negotiation created."); formElement.reset(); refresh(result.data.id); }
  }
  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const formElement = event.currentTarget;
    const payload = Object.fromEntries(new FormData(formElement).entries());
    const result = await api<Negotiation>(`/api/negotiations/${selected.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    if (result.success) { setMessage("Negotiation updated."); formElement.reset(); refresh(result.data.id); }
  }
  return (
    <Shell title="Open negotiation" eyebrow="Negotiation workspace">
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5">
          <h2 className="font-semibold">Create negotiation</h2>
          <form onSubmit={create} className="mt-4 grid gap-3">
            <input name="title" required placeholder="Negotiation title" className={inputClass()} />
            <select name="providerId" className={inputClass()}><option value="">No provider yet</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select>
            <select name="rfqId" className={inputClass()}><option value="">No RFQ</option>{rfqs.map((rfq) => <option key={rfq.id} value={rfq.id}>{rfq.title}</option>)}</select>
            <textarea name="message" rows={4} placeholder="Opening note" className={inputClass()} />
            <button type="submit" className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">Create negotiation</button>
          </form>
          {items.length === 0 ? <p className="mt-4 rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold">No negotiations yet.</p> : null}
          <div className="mt-4 grid gap-2">{items.map((item) => <Link key={item.id} href={`/dashboard/main/negotiations/${item.id}`} className="rounded-2xl bg-[#f3ecdc] p-3 text-sm font-bold">{item.title} - {formatLabel(item.status)}</Link>)}</div>
        </section>
        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5">
          {selected ? (
            <>
              <h2 className="font-semibold">{selected.title}</h2>
              <p className="mt-1 text-sm text-[#675f50]">{selected.provider?.displayName ?? "No provider"} - {selected.rfq?.title ?? "No RFQ"}</p>
              <form onSubmit={update} className="mt-4 grid gap-3">
                <select name="status" className={inputClass()} defaultValue={selected.status}>{negotiationStatuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select>
                <textarea name="message" rows={4} placeholder="Add note or message" className={inputClass()} />
                <button type="submit" className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">Update negotiation</button>
              </form>
              <div className="mt-4 grid gap-2">{selected.messages.map((note) => <p key={note.id} className="rounded-2xl bg-[#f3ecdc] p-3 text-sm"><b>{note.author.name}:</b> {note.body}</p>)}</div>
            </>
          ) : <p className="rounded-2xl bg-[#f3ecdc] p-4 font-semibold">Select or create a negotiation.</p>}
          {message ? <p className="mt-4 rounded-2xl bg-[#edf2dd] p-4 text-sm font-bold">{message}</p> : null}
        </section>
      </div>
    </Shell>
  );
}

export function RiskPage() {
  const [filters, setFilters] = useState({ role: "all", verification: "all", riskLevel: "all" });
  const [items, setItems] = useState<RiskItem[]>([]);
  const [selected, setSelected] = useState<RiskItem | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<RiskItem[]>(`/api/risk-reviews?${new URLSearchParams(filters)}`).then((result) => {
      if (result.success) { setItems(result.data); setSelected(result.data[0] ?? null); }
    });
  }, [filters]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const payload = { ...selected, ...Object.fromEntries(new FormData(event.currentTarget).entries()) };
    const result = await api("/api/risk-reviews", { method: "PATCH", body: JSON.stringify(payload) });
    if (result.success) setMessage("Risk decision saved.");
  }
  return (
    <Shell title="Review risk" eyebrow="Deterministic risk review">
      <div className="grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 md:grid-cols-3">
        <select className={inputClass()} value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>{roles.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}</select>
        <select className={inputClass()} value={filters.verification} onChange={(e) => setFilters({ ...filters, verification: e.target.value })}>{verificationStatuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select>
        <select className={inputClass()} value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}>{riskLevels.map((level) => <option key={level} value={level}>{formatLabel(level)}</option>)}</select>
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="grid gap-2">{items.map((item) => <button key={`${item.targetType}:${item.providerId || item.rfqId}`} type="button" onClick={() => setSelected(item)} className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 text-left text-sm font-bold">{item.title} - {item.riskLevel}</button>)}</div>
        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5">
          {selected ? <>
            <h2 className="font-semibold">{selected.title}</h2>
            <p className="mt-2 text-sm text-[#675f50]">Risk level: {selected.riskLevel}. Existing review: {formatLabel(selected.reviewStatus)}</p>
            <ul className="mt-3 grid gap-2">{(selected.indicators.length ? selected.indicators : ["No deterministic risk indicators."]).map((item) => <li key={item} className="rounded-2xl bg-[#f3ecdc] p-3 text-sm">{item}</li>)}</ul>
            <form onSubmit={submit} className="mt-4 grid gap-3">
              <select name="reviewStatus" className={inputClass()} defaultValue={selected.reviewStatus}>{riskStatuses.filter((status) => status !== "pending").map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select>
              <textarea name="adminNote" rows={4} className={inputClass()} placeholder="Admin review note" defaultValue={selected.adminNote} />
              <button type="submit" className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">Save risk review</button>
            </form>
            <Link href={selected.detailHref} className="mt-4 inline-flex rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">Open detail</Link>
          </> : <p className="font-semibold">No risk items match these filters.</p>}
          {message ? <p className="mt-4 rounded-2xl bg-[#edf2dd] p-4 text-sm font-bold">{message}</p> : null}
        </section>
      </div>
    </Shell>
  );
}

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filters, setFilters] = useState({ category: "all", role: "all", status: "all" });
  const [month, setMonth] = useState(() => new Date());
  const [listView, setListView] = useState(false);
  useEffect(() => {
    api<CalendarEvent[]>(`/api/calendar-events?${new URLSearchParams(filters)}`).then((result) => result.success && setEvents(result.data));
  }, [filters]);
  const visible = events.filter((event) => {
    const date = new Date(event.date);
    return listView || (date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear());
  });
  const categories = ["all", ...Array.from(new Set(events.map((event) => event.category)))];
  const statuses = ["all", ...Array.from(new Set(events.map((event) => event.status)))];
  function shift(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }
  return (
    <Shell title="View calendar" eyebrow="Stored operational dates">
      <div className="grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 md:grid-cols-[repeat(3,1fr)_auto_auto_auto]">
        <select className={inputClass()} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>{categories.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}</select>
        <select className={inputClass()} value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>{roles.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}</select>
        <select className={inputClass()} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>{statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select>
        <button type="button" onClick={() => setMonth(new Date())} className="rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">Today</button>
        <button type="button" onClick={() => shift(-1)} className="rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">Previous</button>
        <button type="button" onClick={() => shift(1)} className="rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">Next</button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{listView ? "List view" : month.toLocaleString("en", { month: "long", year: "numeric" })}</h2>
        <button type="button" onClick={() => setListView((value) => !value)} className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">{listView ? "Month view" : "List view"}</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visible.map((event) => (
          <Link key={event.id} href={event.detailHref} className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6f7f4f]">{formatDate(event.date)} - {formatLabel(event.type)}</p>
            <h3 className="mt-2 font-semibold">{event.title}</h3>
            <p className="mt-1 text-sm text-[#675f50]">{formatLabel(event.role)} - {formatLabel(event.status)}</p>
          </Link>
        ))}
        {visible.length === 0 ? <p className="rounded-2xl bg-[#fffaf0] p-4 font-semibold">No events match this view.</p> : null}
      </div>
    </Shell>
  );
}
