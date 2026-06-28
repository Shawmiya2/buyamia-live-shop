"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type FormState = {
  title: string;
  description: string;
  category: string;
  providerType: "hotel" | "restaurant" | "supplier" | "service_provider";
  scheduledDate: string;
  scheduledTime: string;
  estimatedDurationMinutes: string;
  language: string;
  thumbnailUrl: string;
  visibility: "public" | "private";
};

const initialForm: FormState = {
  title: "",
  description: "",
  category: "",
  providerType: "supplier",
  scheduledDate: "",
  scheduledTime: "",
  estimatedDurationMinutes: "30",
  language: "English",
  thumbnailUrl: "",
  visibility: "public",
};

const providerTypes = [
  ["hotel", "Hotel"],
  ["restaurant", "Restaurant"],
  ["supplier", "Supplier"],
  ["service_provider", "Service Provider"],
] as const;
const categories = ["Rooms", "Hotel", "Restaurant", "Food & Brunch", "Spa", "Facilities", "Services", "Experiences", "Furniture", "Other"];
const languages = ["English", "Indonesian", "French", "Mandarin", "Japanese", "Spanish"];

export default function ScheduleStreamPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [showSummary, setShowSummary] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const scheduledAt = useMemo(() => {
    if (!form.scheduledDate || !form.scheduledTime) {
      return "";
    }
    return new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString();
  }, [form.scheduledDate, form.scheduledTime]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      if (key === "scheduledDate" || key === "scheduledTime") delete next.scheduledAt;
      return next;
    });
  }

  function validateLocal() {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Please enter a stream title.";
    if (!form.category) errors.category = "Please select a category.";
    if (!form.scheduledDate || !form.scheduledTime) errors.scheduledAt = "Please select a scheduled date and time.";
    if (scheduledAt && new Date(scheduledAt) <= new Date()) errors.scheduledAt = "The scheduled date and time must be in the future.";
    if (!form.estimatedDurationMinutes || Number(form.estimatedDurationMinutes) < 15) errors.estimatedDurationMinutes = "Duration must be at least 15 minutes.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (validateLocal()) {
      setShowSummary(true);
    }
  }

  async function submit() {
    if (!validateLocal()) {
      setShowSummary(false);
      return;
    }

    setPending(true);
    setMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/lives/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          providerType: form.providerType,
          scheduledAt,
          estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
          language: form.language,
          thumbnailUrl: form.thumbnailUrl || undefined,
          visibility: form.visibility,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ id: string }>;
      if (!payload.success) {
        setFieldErrors(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setMessage("Stream scheduled. It now appears in the live calendar and catalogue.");
      setForm(initialForm);
      setShowSummary(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to schedule this stream.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/live" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to live room
          </Link>
          <Link href="/live/calendar" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            View calendar
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Schedule stream</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
            Schedule a future Buyamia live stream
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Authenticated providers can create a scheduled stream for the live calendar, catalogue, and provider dashboards.
          </p>
        </section>

        <form onSubmit={review} className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Stream title" error={fieldErrors.title}>
              <input className={inputClass()} value={form.title} onChange={(event) => update("title", event.target.value)} />
            </Field>
            <Field label="Category" error={fieldErrors.category}>
              <select className={inputClass()} value={form.category} onChange={(event) => update("category", event.target.value)}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="Provider type" error={fieldErrors.providerType}>
              <select className={inputClass()} value={form.providerType} onChange={(event) => update("providerType", event.target.value as FormState["providerType"])}>
                {providerTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Estimated duration" error={fieldErrors.estimatedDurationMinutes}>
              <input className={inputClass()} type="number" min="15" max="480" step="15" value={form.estimatedDurationMinutes} onChange={(event) => update("estimatedDurationMinutes", event.target.value)} />
            </Field>
            <Field label="Scheduled date" error={fieldErrors.scheduledAt}>
              <input className={inputClass()} type="date" value={form.scheduledDate} onChange={(event) => update("scheduledDate", event.target.value)} />
            </Field>
            <Field label="Scheduled time" error={fieldErrors.scheduledAt}>
              <input className={inputClass()} type="time" value={form.scheduledTime} onChange={(event) => update("scheduledTime", event.target.value)} />
            </Field>
            <Field label="Language">
              <select className={inputClass()} value={form.language} onChange={(event) => update("language", event.target.value)}>
                {languages.map((language) => <option key={language} value={language}>{language}</option>)}
              </select>
            </Field>
            <Field label="Visibility">
              <select className={inputClass()} value={form.visibility} onChange={(event) => update("visibility", event.target.value as FormState["visibility"])}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </Field>
            <Field label="Thumbnail URL optional" error={fieldErrors.thumbnailUrl}>
              <input className={inputClass()} value={form.thumbnailUrl} placeholder="https://example.com/thumbnail.jpg" onChange={(event) => update("thumbnailUrl", event.target.value)} />
            </Field>
            <Field label="Stream description">
              <textarea className={inputClass()} rows={5} value={form.description} onChange={(event) => update("description", event.target.value)} />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">
              Review schedule
            </button>
          </div>
        </form>

        {showSummary && (
          <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#6f7f4f]">Review & submit</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Summary label="Stream" value={`${form.title} / ${form.category}`} />
              <Summary label="Provider" value={labelForProvider(form.providerType)} />
              <Summary label="Date" value={scheduledAt ? new Date(scheduledAt).toLocaleString("en-US") : "-"} />
              <Summary label="Duration" value={`${form.estimatedDurationMinutes} minutes`} />
              <Summary label="Language" value={form.language} />
              <Summary label="Visibility" value={form.visibility} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" disabled={pending} onClick={submit} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
                {pending ? "Scheduling..." : "Schedule stream"}
              </button>
              <button type="button" disabled={pending} onClick={() => setShowSummary(false)} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold">
                Edit
              </button>
            </div>
          </section>
        )}

        {message && (
          <p className={`mt-5 rounded-2xl p-4 text-sm font-bold ${message.startsWith("Stream scheduled") ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>
            {message}
          </p>
        )}
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-4">
      <p className="text-xs font-black uppercase tracking-[.14em] text-[#6f7f4f]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function labelForProvider(value: FormState["providerType"]) {
  return providerTypes.find(([current]) => current === value)?.[1] ?? value;
}
