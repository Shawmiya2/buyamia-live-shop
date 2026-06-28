"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type ContentType = "service" | "live_stream" | "replay";
type ContentOption = { id: string; title: string; category: string; status?: string; scheduledAt?: string | null; endedAt?: string | null };
type PlacementOptions = {
  service: ContentOption;
  liveStreams: ContentOption[];
  replays: ContentOption[];
};
type PlacementRequest = {
  id: string;
  contentType: ContentType;
  contentId: string;
  promotionTitle: string;
  reason: string;
  promotionPeriod: string;
  preferredStartDate: string;
  preferredEndDate: string;
  targetAudience: string;
  additionalNotes?: string | null;
  status: string;
};

const initialForm = {
  contentType: "service" as ContentType,
  contentId: "",
  promotionTitle: "",
  reason: "",
  promotionPeriod: "7 days",
  preferredStartDate: "",
  preferredEndDate: "",
  targetAudience: "",
  additionalNotes: "",
  status: "submitted",
};

export default function PinnedPlacementPage() {
  const [options, setOptions] = useState<PlacementOptions | null>(null);
  const [requests, setRequests] = useState<PlacementRequest[]>([]);
  const [form, setForm] = useState(initialForm);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/services/pinned-placement")
      .then((response) => response.json())
      .then((payload: ApiEnvelope<{ options: PlacementOptions; requests: PlacementRequest[] }>) => {
        if (!active) return;
        if (payload.success) {
          setOptions(payload.data.options);
          setRequests(payload.data.requests);
          setForm((current) => ({ ...current, contentId: payload.data.options.service.id }));
        } else {
          setMessage(payload.error.message);
        }
      })
      .catch(() => active && setMessage("Unable to load pinned placement options."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const contentOptions = useMemo(() => {
    if (!options) return [];
    if (form.contentType === "live_stream") return options.liveStreams;
    if (form.contentType === "replay") return options.replays;
    return [options.service];
  }, [form.contentType, options]);

  const selectedContent = contentOptions.find((item) => item.id === form.contentId);

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "contentType" && options) {
        const type = value as ContentType;
        next.contentId = type === "live_stream" ? options.liveStreams[0]?.id ?? "" : type === "replay" ? options.replays[0]?.id ?? "" : options.service.id;
      }
      return next;
    });
    setFields((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setShowSummary(true);
  }

  async function submit() {
    setPending(true);
    setFields({});
    setMessage("");
    try {
      const response = await fetch("/api/services/pinned-placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as ApiEnvelope<PlacementRequest>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        setShowSummary(false);
        throw new Error(payload.error.message);
      }
      setRequests((current) => [payload.data, ...current]);
      setMessage("Pinned placement request submitted.");
      setShowSummary(false);
      setForm({ ...initialForm, contentId: options?.service.id ?? "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit pinned placement request.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/services" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to services dashboard
          </Link>
          <Link href="/services/replay-availability" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Replay availability
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Pinned placement</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">Request premium placement</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Submit a request to feature a service profile, live stream, or replay for later admin review.
          </p>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <form onSubmit={review} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Content type" error={fields.contentType}>
                <select className={inputClass()} value={form.contentType} onChange={(event) => update("contentType", event.target.value as ContentType)} disabled={loading}>
                  <option value="service">Service</option>
                  <option value="live_stream">Live Stream</option>
                  <option value="replay">Replay</option>
                </select>
              </Field>
              <Field label="Content selection" error={fields.contentId}>
                <select className={inputClass()} value={form.contentId} onChange={(event) => update("contentId", event.target.value)} disabled={loading || !contentOptions.length}>
                  <option value="">Select content</option>
                  {contentOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </Field>
              <Field label="Promotion title" error={fields.promotionTitle}>
                <input className={inputClass()} value={form.promotionTitle} onChange={(event) => update("promotionTitle", event.target.value)} />
              </Field>
              <Field label="Promotion period" error={fields.promotionPeriod}>
                <input className={inputClass()} value={form.promotionPeriod} onChange={(event) => update("promotionPeriod", event.target.value)} />
              </Field>
              <Field label="Preferred start date" error={fields.preferredStartDate}>
                <input type="date" className={inputClass()} value={form.preferredStartDate} onChange={(event) => update("preferredStartDate", event.target.value)} />
              </Field>
              <Field label="Preferred end date" error={fields.preferredEndDate}>
                <input type="date" className={inputClass()} value={form.preferredEndDate} onChange={(event) => update("preferredEndDate", event.target.value)} />
              </Field>
              <Field label="Target audience" error={fields.targetAudience}>
                <input className={inputClass()} value={form.targetAudience} onChange={(event) => update("targetAudience", event.target.value)} />
              </Field>
              <Field label="Status" error={fields.status}>
                <select className={inputClass()} value={form.status} onChange={(event) => update("status", event.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                </select>
              </Field>
              <Field label="Reason for request" error={fields.reason}>
                <textarea className={`${inputClass()} min-h-28`} value={form.reason} onChange={(event) => update("reason", event.target.value)} />
              </Field>
              <Field label="Additional notes" error={fields.additionalNotes}>
                <textarea className={`${inputClass()} min-h-28`} value={form.additionalNotes} onChange={(event) => update("additionalNotes", event.target.value)} />
              </Field>
            </div>
            <button type="submit" disabled={pending || loading} className="mt-5 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
              Review request
            </button>
            {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${message.includes("submitted") ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>{message}</p>}
          </form>

          <aside className="grid gap-5">
            {showSummary && (
              <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#6f7f4f]">Review & submit</p>
                <div className="mt-3 grid gap-2">
                  <Summary label="Content" value={selectedContent?.title ?? "Not selected"} />
                  <Summary label="Type" value={label(form.contentType)} />
                  <Summary label="Period" value={`${form.preferredStartDate || "-"} to ${form.preferredEndDate || "-"}`} />
                  <Summary label="Audience" value={form.targetAudience || "-"} />
                </div>
                <button type="button" disabled={pending} onClick={submit} className="mt-4 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
                  {pending ? "Submitting..." : "Submit request"}
                </button>
              </section>
            )}

            <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#6f7f4f]">Recent requests</p>
              <div className="mt-3 grid gap-3">
                {requests.slice(0, 5).map((request) => (
                  <div key={request.id} className="rounded-2xl bg-[#f3ecdc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black">{request.promotionTitle}</p>
                      <span className="rounded-full bg-[#1f251a] px-2 py-1 text-xs font-black text-[#fffaf0]">{label(request.status)}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#675f50]">{label(request.contentType)} · {new Date(request.preferredStartDate).toLocaleDateString("en-US")}</p>
                  </div>
                ))}
                {!requests.length && <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">No pinned placement requests yet.</p>}
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

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
