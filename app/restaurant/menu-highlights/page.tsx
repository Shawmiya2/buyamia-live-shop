"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type MenuHighlight = {
  id: string;
  dishName: string;
  category: string;
  shortDescription: string;
  price: number;
  availabilityStatus: string;
  featuredImageUrl?: string | null;
  featuredBadge?: string | null;
  priorityLevel: number;
  startDate: string;
  endDate: string;
  visibilityStatus: string;
  isPinned: boolean;
  status: string;
};

const emptyForm = {
  dishName: "",
  category: "",
  shortDescription: "",
  price: "",
  availabilityStatus: "available",
  featuredImageUrl: "",
  featuredBadge: "",
  priorityLevel: "5",
  startDate: "",
  endDate: "",
  visibilityStatus: "public",
  isPinned: false,
  status: "scheduled",
};

const statuses = ["draft", "scheduled", "active", "expired", "archived"] as const;
const availability = ["available", "limited", "sold_out", "seasonal"] as const;
const visibility = ["public", "private", "live_only"] as const;
const sortOptions = [
  ["active", "Active highlights"],
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["highest_priority", "Highest priority"],
  ["alphabetical", "Alphabetical"],
] as const;

export default function MenuHighlightsPage() {
  const [highlights, setHighlights] = useState<MenuHighlight[]>([]);
  const [selected, setSelected] = useState<MenuHighlight | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: "", category: "", availabilityStatus: "", status: "", date: "", featured: "", sort: "active" });
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
    loadHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function loadHighlights() {
    setLoading(true);
    fetch(`/api/restaurant/menu-highlights?${query}`)
      .then((response) => response.json())
      .then((payload: ApiEnvelope<MenuHighlight[]>) => {
        if (payload.success) {
          setHighlights(payload.data);
          setSelected((current) => current ? payload.data.find((item) => item.id === current.id) ?? null : payload.data[0] ?? null);
        } else {
          setMessage(payload.error.message);
        }
      })
      .catch(() => setMessage("Unable to load menu highlights."))
      .finally(() => setLoading(false));
  }

  function update(name: keyof typeof emptyForm, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function editHighlight(highlight: MenuHighlight) {
    setSelected(highlight);
    setForm({
      dishName: highlight.dishName,
      category: highlight.category,
      shortDescription: highlight.shortDescription,
      price: String(highlight.price),
      availabilityStatus: highlight.availabilityStatus,
      featuredImageUrl: highlight.featuredImageUrl ?? "",
      featuredBadge: highlight.featuredBadge ?? "",
      priorityLevel: String(highlight.priorityLevel),
      startDate: new Date(highlight.startDate).toISOString().slice(0, 10),
      endDate: new Date(highlight.endDate).toISOString().slice(0, 10),
      visibilityStatus: highlight.visibilityStatus,
      isPinned: highlight.isPinned,
      status: highlight.status,
    });
    setFields({});
    setMessage("");
  }

  function newHighlight() {
    setSelected(null);
    setForm(emptyForm);
    setFields({});
    setMessage("");
  }

  function payloadFromForm() {
    return {
      ...form,
      price: Number(form.price),
      priorityLevel: Number(form.priorityLevel),
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFields({});
    setMessage("");
    try {
      const response = await fetch(selected ? `/api/restaurant/menu-highlights/${selected.id}` : "/api/restaurant/menu-highlights", {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm()),
      });
      const payload = (await response.json()) as ApiEnvelope<MenuHighlight>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setSelected(payload.data);
      setHighlights((current) => selected ? current.map((item) => item.id === payload.data.id ? payload.data : item) : [payload.data, ...current]);
      setMessage(selected ? "Menu highlight updated." : "Menu highlight created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save menu highlight.");
    } finally {
      setPending(false);
    }
  }

  async function quickUpdate(highlight: MenuHighlight, input: Record<string, string | boolean | number>) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/restaurant/menu-highlights/${highlight.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as ApiEnvelope<MenuHighlight>;
      if (!payload.success) throw new Error(payload.error.message);
      setHighlights((current) => current.map((item) => item.id === payload.data.id ? payload.data : item));
      setSelected((current) => current?.id === payload.data.id ? payload.data : current);
      setMessage("Menu highlight updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update menu highlight.");
    } finally {
      setPending(false);
    }
  }

  async function deleteHighlight(highlight: MenuHighlight) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/restaurant/menu-highlights/${highlight.id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiEnvelope<{ deleted: boolean }>;
      if (!payload.success) throw new Error(payload.error.message);
      setHighlights((current) => current.filter((item) => item.id !== highlight.id));
      if (selected?.id === highlight.id) newHighlight();
      setMessage("Menu highlight deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete menu highlight.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/restaurant" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to restaurant dashboard
          </Link>
          <Link href="/restaurant/create-tasting" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Create tasting
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Menu highlights</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">Pin menu highlights</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Manage featured dishes for live sessions, restaurant profiles, promotional sections, and discovery surfaces.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <input className={inputClass()} placeholder="Search dish" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            <input className={inputClass()} placeholder="Category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} />
            <select className={inputClass()} value={filters.availabilityStatus} onChange={(event) => setFilters({ ...filters, availabilityStatus: event.target.value })}>
              <option value="">All availability</option>
              {availability.map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
            <select className={inputClass()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
            <input type="date" className={inputClass()} value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
            <select className={inputClass()} value={filters.featured} onChange={(event) => setFilters({ ...filters, featured: event.target.value })}>
              <option value="">Featured and not</option>
              <option value="featured">Featured</option>
              <option value="not_featured">Not featured</option>
            </select>
            <select className={inputClass()} value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
              {sortOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#6f7f4f]">{loading ? "Loading highlights" : `${highlights.length} highlights`}</p>
              <button type="button" onClick={newHighlight} className="rounded-full bg-[#1f251a] px-3 py-2 text-xs font-black text-[#fffaf0]">New highlight</button>
            </div>
            <div className="grid gap-3">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <button type="button" onClick={() => editHighlight(highlight)} className="text-left">
                      <p className="text-sm font-black">{highlight.dishName}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#675f50]">
                        {highlight.category} · {money(highlight.price)} · Priority {highlight.priorityLevel} · {label(highlight.status)}
                      </p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-[#766e5e]">{highlight.shortDescription}</p>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <Action disabled={pending} label={highlight.isPinned ? "Unpin" : "Pin"} onClick={() => quickUpdate(highlight, { isPinned: !highlight.isPinned })} />
                      <Action disabled={pending} label="Archive" onClick={() => quickUpdate(highlight, { status: "archived" })} />
                      <Action disabled={pending} label="Delete" onClick={() => deleteHighlight(highlight)} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlight.isPinned && <Badge text="Pinned" />}
                    {highlight.featuredBadge && <Badge text={highlight.featuredBadge} />}
                    <Badge text={label(highlight.availabilityStatus)} />
                    <Badge text={label(highlight.visibilityStatus)} />
                  </div>
                </div>
              ))}
              {!loading && !highlights.length && <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">No menu highlights match the current filters.</p>}
            </div>
          </section>

          <form onSubmit={submit} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#6f7f4f]">{selected ? "Edit highlight" : "Create highlight"}</p>
              {selected && <button type="button" onClick={newHighlight} className="text-xs font-black text-[#596540]">Clear</button>}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field error={fields.dishName}><input className={inputClass()} placeholder="Dish name" value={form.dishName} onChange={(event) => update("dishName", event.target.value)} /></Field>
              <Field error={fields.category}><input className={inputClass()} placeholder="Category" value={form.category} onChange={(event) => update("category", event.target.value)} /></Field>
              <Field error={fields.price}><input type="number" min="0" className={inputClass()} placeholder="Price" value={form.price} onChange={(event) => update("price", event.target.value)} /></Field>
              <Field error={fields.priorityLevel}><input type="number" min="1" max="10" className={inputClass()} placeholder="Priority 1-10" value={form.priorityLevel} onChange={(event) => update("priorityLevel", event.target.value)} /></Field>
              <Field error={fields.availabilityStatus}>
                <select className={inputClass()} value={form.availabilityStatus} onChange={(event) => update("availabilityStatus", event.target.value)}>
                  {availability.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                </select>
              </Field>
              <Field error={fields.visibilityStatus}>
                <select className={inputClass()} value={form.visibilityStatus} onChange={(event) => update("visibilityStatus", event.target.value)}>
                  {visibility.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                </select>
              </Field>
              <Field error={fields.status}>
                <select className={inputClass()} value={form.status} onChange={(event) => update("status", event.target.value)}>
                  {statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#596540]">
                <input type="checkbox" checked={form.isPinned} onChange={(event) => update("isPinned", event.target.checked)} />
                Featured / pinned
              </label>
              <Field error={fields.startDate}><input type="date" className={inputClass()} value={form.startDate} onChange={(event) => update("startDate", event.target.value)} /></Field>
              <Field error={fields.endDate}><input type="date" className={inputClass()} value={form.endDate} onChange={(event) => update("endDate", event.target.value)} /></Field>
              <Field error={fields.featuredBadge}><input className={inputClass()} placeholder="Featured badge" value={form.featuredBadge} onChange={(event) => update("featuredBadge", event.target.value)} /></Field>
              <Field error={fields.featuredImageUrl}><input className={inputClass()} placeholder="Featured image URL" value={form.featuredImageUrl} onChange={(event) => update("featuredImageUrl", event.target.value)} /></Field>
              <Field error={fields.shortDescription}><textarea className={`${inputClass()} min-h-28 md:col-span-2`} placeholder="Short description" value={form.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} /></Field>
            </div>
            <button type="submit" disabled={pending} className="mt-5 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
              {pending ? "Saving..." : selected ? "Save highlight" : "Create highlight"}
            </button>
            {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${message.includes("Unable") ? "bg-[#fff3ed] text-[#8c3f2b]" : "bg-[#edf2dd] text-[#596540]"}`}>{message}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {children}
      {error && <span className="text-sm font-semibold text-[#8c3f2b]">{error}</span>}
    </label>
  );
}

function Action({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-black disabled:opacity-60">{label}</button>;
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#596540]">{text}</span>;
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
