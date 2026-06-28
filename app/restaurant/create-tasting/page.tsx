"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type RestaurantOption = { id: string; displayName: string };
type Tasting = {
  id: string;
  status: string;
  title: string;
  restaurantName: string;
  description: string;
  cuisineCategory: string;
  tastingType: string;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  price?: number | null;
  location: string;
  featuredImageUrl?: string | null;
  additionalNotes?: string | null;
};

const cuisineCategories = ["Balinese", "Indonesian", "Japanese", "Mediterranean", "Plant-based", "Seafood", "Chef table"];
const tastingTypes = [
  ["in_person", "In-person"],
  ["live", "Live"],
  ["hybrid", "Hybrid"],
] as const;
const statuses = [
  ["draft", "Draft"],
  ["scheduled", "Scheduled"],
  ["published", "Published"],
] as const;

const emptyForm = {
  title: "",
  restaurantName: "",
  description: "",
  cuisineCategory: "Balinese",
  tastingType: "in_person",
  date: "",
  time: "",
  durationMinutes: "90",
  maxParticipants: "16",
  price: "",
  location: "",
  featuredImageUrl: "",
  additionalNotes: "",
  status: "scheduled",
};

export default function CreateTastingPage() {
  const [form, setForm] = useState(emptyForm);
  const [restaurant, setRestaurant] = useState<RestaurantOption | null>(null);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Tasting | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/restaurant/tastings")
      .then((response) => response.json())
      .then((payload: ApiEnvelope<{ restaurant: RestaurantOption | null; tastings: Tasting[] }>) => {
        if (!active) return;
        if (payload.success) {
          setRestaurant(payload.data.restaurant);
          setTastings(payload.data.tastings);
          setForm((current) => ({
            ...current,
            restaurantName: payload.data.restaurant?.displayName ?? current.restaurantName,
          }));
        } else {
          setMessage(payload.error.message);
        }
      })
      .catch(() => active && setMessage("Unable to load restaurant tasting options."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const typeLabel = tastingTypes.find(([value]) => value === form.tastingType)?.[1] ?? "In-person";
    return [
      ["Restaurant", form.restaurantName || restaurant?.displayName || "Not set"],
      ["Cuisine", form.cuisineCategory],
      ["Format", typeLabel],
      ["Schedule", form.date && form.time ? `${form.date} at ${form.time}` : "Not set"],
      ["Capacity", `${form.maxParticipants || 0} guests`],
      ["Status", form.status.replace(/_/g, " ")],
    ];
  }, [form, restaurant]);

  function update(name: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});
    setCreated(null);

    try {
      const response = await fetch("/api/restaurant/tastings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMinutes: Number(form.durationMinutes),
          maxParticipants: Number(form.maxParticipants),
          price: form.price === "" ? "" : Number(form.price),
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<Tasting>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setCreated(payload.data);
      setTastings((current) => [payload.data, ...current]);
      setMessage("Tasting created successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create tasting.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/restaurant" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to restaurant dashboard
          </Link>
          <Link href="/live/schedule" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Schedule stream
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Restaurant tasting</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">Create a tasting experience</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Build a scheduled tasting for diners, live viewers, or hybrid guests while keeping restaurant operations in one focused flow.
          </p>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.8fr]">
          <form onSubmit={submit} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tasting title" error={fields.title}>
                <input className={inputClass()} value={form.title} onChange={(event) => update("title", event.target.value)} />
              </Field>
              <Field label="Restaurant name" error={fields.restaurantName}>
                <input className={inputClass()} value={form.restaurantName} onChange={(event) => update("restaurantName", event.target.value)} disabled={loading} />
              </Field>
              <Field label="Cuisine category" error={fields.cuisineCategory}>
                <select className={inputClass()} value={form.cuisineCategory} onChange={(event) => update("cuisineCategory", event.target.value)}>
                  {cuisineCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Tasting type" error={fields.tastingType}>
                <select className={inputClass()} value={form.tastingType} onChange={(event) => update("tastingType", event.target.value)}>
                  {tastingTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Date" error={fields.date}>
                <input type="date" className={inputClass()} value={form.date} onChange={(event) => update("date", event.target.value)} />
              </Field>
              <Field label="Time" error={fields.time}>
                <input type="time" className={inputClass()} value={form.time} onChange={(event) => update("time", event.target.value)} />
              </Field>
              <Field label="Duration minutes" error={fields.durationMinutes}>
                <input type="number" min="1" className={inputClass()} value={form.durationMinutes} onChange={(event) => update("durationMinutes", event.target.value)} />
              </Field>
              <Field label="Maximum participants" error={fields.maxParticipants}>
                <input type="number" min="1" className={inputClass()} value={form.maxParticipants} onChange={(event) => update("maxParticipants", event.target.value)} />
              </Field>
              <Field label="Price optional" error={fields.price}>
                <input type="number" min="0" className={inputClass()} value={form.price} onChange={(event) => update("price", event.target.value)} />
              </Field>
              <Field label="Status" error={fields.status}>
                <select className={inputClass()} value={form.status} onChange={(event) => update("status", event.target.value)}>
                  {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Location or Online" error={fields.location}>
                <input className={inputClass()} value={form.location} onChange={(event) => update("location", event.target.value)} />
              </Field>
              <Field label="Featured image URL" error={fields.featuredImageUrl}>
                <input className={inputClass()} value={form.featuredImageUrl} onChange={(event) => update("featuredImageUrl", event.target.value)} />
              </Field>
              <Field label="Description" error={fields.description}>
                <textarea className={inputClass("min-h-28 md:col-span-2")} value={form.description} onChange={(event) => update("description", event.target.value)} />
              </Field>
              <Field label="Additional notes" error={fields.additionalNotes}>
                <textarea className={inputClass("min-h-24 md:col-span-2")} value={form.additionalNotes} onChange={(event) => update("additionalNotes", event.target.value)} />
              </Field>
            </div>
            <button type="submit" disabled={pending || loading} className="mt-5 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
              {pending ? "Creating..." : "Create Tasting"}
            </button>
            {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${created ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>{message}</p>}
          </form>

          <aside className="grid gap-5">
            <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#6f7f4f]">Review summary</p>
              <div className="mt-3 grid gap-2">
                {summary.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f3ecdc] px-4 py-3 text-sm">
                    <span className="font-bold text-[#596540]">{label}</span>
                    <span className="text-right font-semibold text-[#675f50]">{value}</span>
                  </div>
                ))}
              </div>
              {created && (
                <div className="mt-4 rounded-2xl bg-[#edf2dd] p-4 text-sm font-semibold leading-6 text-[#596540]">
                  {created.title} is saved for {new Date(created.scheduledAt).toLocaleString("en-US")}.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#6f7f4f]">Recent tastings</p>
              <div className="mt-3 grid gap-3">
                {tastings.slice(0, 4).map((tasting) => (
                  <div key={tasting.id} className="rounded-2xl bg-[#f3ecdc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black">{tasting.title}</p>
                      <span className="rounded-full bg-[#1f251a] px-2 py-1 text-xs font-black text-[#fffaf0]">{tasting.status.replace(/_/g, " ")}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#675f50]">
                      {new Date(tasting.scheduledAt).toLocaleString("en-US")} · {tasting.maxParticipants} guests
                    </p>
                  </div>
                ))}
                {!tastings.length && <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">No tastings created yet.</p>}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {label}
      {children}
      {error && <span className="text-sm font-semibold text-[#8c3f2b]">{error}</span>}
    </label>
  );
}

function inputClass(extra = "") {
  return `rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none ${extra}`;
}
