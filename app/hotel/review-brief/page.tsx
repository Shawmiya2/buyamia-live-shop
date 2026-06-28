"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type { ReviewBriefReport } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type HotelOption = { id: string; displayName: string };
type ReviewBriefResponse = {
  id: string;
  hotelName: string;
  reviewPeriod: string;
  reviewSource: string;
  language: string;
  report: ReviewBriefReport;
};

const periods = [
  ["last_7_days", "Last 7 days"],
  ["last_30_days", "Last 30 days"],
  ["last_90_days", "Last 90 days"],
  ["year_to_date", "Year to date"],
] as const;
const sources = [
  ["all", "All sources"],
  ["verified_stays", "Verified stays"],
  ["live_replay", "Live and replay"],
  ["booking_channels", "Booking channels"],
] as const;
const languages = ["English", "Indonesian", "French", "Mandarin", "Japanese"];

export default function ReviewBriefPage() {
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [providerId, setProviderId] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState("last_30_days");
  const [reviewSource, setReviewSource] = useState("all");
  const [language, setLanguage] = useState("English");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [brief, setBrief] = useState<ReviewBriefResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/hotel/review-briefs")
      .then((response) => response.json())
      .then((payload: ApiEnvelope<{ hotels: HotelOption[] }>) => {
        if (!active) return;
        if (payload.success) {
          setHotels(payload.data.hotels);
          setProviderId(payload.data.hotels[0]?.id ?? "");
        } else {
          setMessage(payload.error.message);
        }
      })
      .catch(() => active && setMessage("Unable to load hotel review options."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});
    setBrief(null);

    try {
      const response = await fetch("/api/hotel/review-briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, reviewPeriod, reviewSource, language }),
      });
      const payload = (await response.json()) as ApiEnvelope<ReviewBriefResponse>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setBrief(payload.data);
      setMessage("Review brief generated and saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate review brief.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/hotel" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to hotel dashboard
          </Link>
          <Link href="/hotel/booking-push" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Create booking push
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Review brief</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
            Generate a hotel review summary
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Create a mock AI management brief from verified review signals, live replay proof, and booking-channel themes.
          </p>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <form onSubmit={submit} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="grid gap-4">
              <Field label="Hotel selection" error={fields.providerId}>
                <select className={inputClass()} value={providerId} onChange={(event) => setProviderId(event.target.value)} disabled={loading}>
                  {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.displayName}</option>)}
                </select>
              </Field>
              <Field label="Review period" error={fields.reviewPeriod}>
                <select className={inputClass()} value={reviewPeriod} onChange={(event) => setReviewPeriod(event.target.value)}>
                  {periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Review source" error={fields.reviewSource}>
                <select className={inputClass()} value={reviewSource} onChange={(event) => setReviewSource(event.target.value)}>
                  {sources.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Language" error={fields.language}>
                <select className={inputClass()} value={language} onChange={(event) => setLanguage(event.target.value)}>
                  {languages.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
            </div>
            <button type="submit" disabled={pending || loading || !providerId} className="mt-5 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
              {pending ? "Generating..." : "Generate Review Brief"}
            </button>
            {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${brief ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>{message}</p>}
          </form>

          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            {brief ? (
              <ReviewReport brief={brief} />
            ) : (
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
                Generate a review brief to see sentiment, complaint themes, amenities, and management actions.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function ReviewReport({ brief }: { brief: ReviewBriefResponse }) {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6f7f4f]">{brief.hotelName}</p>
          <h2 className="mt-1 text-2xl font-semibold">Management review brief</h2>
        </div>
        <span className="w-fit rounded-full bg-[#1f251a] px-3 py-1 text-xs font-black text-[#fffaf0]">
          Sentiment {brief.report.overallSentimentScore}
        </span>
      </div>
      <p className="mt-4 rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold leading-6 text-[#675f50]">
        {brief.report.managementSummary}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Panel title="Positive highlights" items={[brief.report.positiveReviewSummary]} />
        <Panel title="Common complaints" items={[brief.report.negativeReviewSummary]} />
        <Panel title="Most mentioned topics" items={brief.report.mostMentionedTopics} />
        <Panel title="Recommended improvements" items={brief.report.improvementOpportunities} />
        <Panel title="Priority actions" items={brief.report.recommendedManagementActions} />
        <Panel title="Generated" items={[new Date(brief.report.generatedAt).toLocaleString("en-US")]} />
      </div>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-4">
      <p className="text-xs font-black uppercase tracking-[.14em] text-[#6f7f4f]">{title}</p>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => <li key={item} className="text-sm font-semibold leading-6 text-[#675f50]">{item}</li>)}
      </ul>
    </div>
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

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}
