"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import type { BookingPushInput } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type FormState = {
  campaignTitle: string;
  hotelName: string;
  promotionDescription: string;
  roomType: string;
  bookingOffer: string;
  discountPercentage: string;
  startDate: string;
  endDate: string;
  availableRooms: string;
  targetAudience: string;
  featuredImageUrl: string;
  callToActionText: string;
  status: BookingPushInput["status"];
};

const initialForm: FormState = {
  campaignTitle: "",
  hotelName: "",
  promotionDescription: "",
  roomType: "",
  bookingOffer: "",
  discountPercentage: "",
  startDate: "",
  endDate: "",
  availableRooms: "",
  targetAudience: "",
  featuredImageUrl: "",
  callToActionText: "Book now",
  status: "scheduled",
};

export default function BookingPushPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [showSummary, setShowSummary] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFields((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateLocal() {
    const errors: Record<string, string> = {};
    if (!form.campaignTitle.trim()) errors.campaignTitle = "Please enter a campaign title.";
    if (!form.hotelName.trim()) errors.hotelName = "Please enter the hotel name.";
    if (!form.promotionDescription.trim()) errors.promotionDescription = "Please describe the promotion.";
    if (!form.roomType.trim()) errors.roomType = "Please enter a room type.";
    if (!form.bookingOffer.trim()) errors.bookingOffer = "Please enter the booking offer.";
    if (!form.startDate) errors.startDate = "Please select a start date.";
    if (!form.endDate) errors.endDate = "Please select an end date.";
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) errors.endDate = "End date must be after start date.";
    if (!form.availableRooms || Number(form.availableRooms) <= 0) errors.availableRooms = "Please enter available rooms.";
    if (!form.targetAudience.trim()) errors.targetAudience = "Please enter a target audience.";
    if (!form.callToActionText.trim()) errors.callToActionText = "Please enter call-to-action text.";
    setFields(errors);
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
    setFields({});

    try {
      const response = await fetch("/api/hotel/booking-pushes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined,
          availableRooms: Number(form.availableRooms),
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ id: string }>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setMessage("Booking push created. The campaign is stored for hotel promotion workflows.");
      setForm(initialForm);
      setShowSummary(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create booking push.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/hotel" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to hotel dashboard
          </Link>
          <Link href="/live" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Open live room
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Booking push</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
            Create a hotel booking promotion
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Build a focused room offer for hotel audiences while keeping dashboard quick actions compact.
          </p>
        </section>

        <form onSubmit={review} className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Campaign title" error={fields.campaignTitle}>
              <input className={inputClass()} value={form.campaignTitle} onChange={(event) => update("campaignTitle", event.target.value)} />
            </Field>
            <Field label="Hotel name" error={fields.hotelName}>
              <input className={inputClass()} value={form.hotelName} onChange={(event) => update("hotelName", event.target.value)} />
            </Field>
            <Field label="Promotion description" error={fields.promotionDescription} wide>
              <textarea className={inputClass()} rows={4} value={form.promotionDescription} onChange={(event) => update("promotionDescription", event.target.value)} />
            </Field>
            <Field label="Room type" error={fields.roomType}>
              <input className={inputClass()} value={form.roomType} onChange={(event) => update("roomType", event.target.value)} />
            </Field>
            <Field label="Booking offer" error={fields.bookingOffer}>
              <input className={inputClass()} value={form.bookingOffer} onChange={(event) => update("bookingOffer", event.target.value)} />
            </Field>
            <Field label="Discount percentage optional" error={fields.discountPercentage}>
              <input className={inputClass()} type="number" min="0" max="100" value={form.discountPercentage} onChange={(event) => update("discountPercentage", event.target.value)} />
            </Field>
            <Field label="Available rooms" error={fields.availableRooms}>
              <input className={inputClass()} type="number" min="1" value={form.availableRooms} onChange={(event) => update("availableRooms", event.target.value)} />
            </Field>
            <Field label="Start date" error={fields.startDate}>
              <input className={inputClass()} type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} />
            </Field>
            <Field label="End date" error={fields.endDate}>
              <input className={inputClass()} type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} />
            </Field>
            <Field label="Target audience" error={fields.targetAudience}>
              <input className={inputClass()} value={form.targetAudience} placeholder="Singapore families, Bali repeat guests..." onChange={(event) => update("targetAudience", event.target.value)} />
            </Field>
            <Field label="Call-to-action text" error={fields.callToActionText}>
              <input className={inputClass()} value={form.callToActionText} onChange={(event) => update("callToActionText", event.target.value)} />
            </Field>
            <Field label="Featured image URL optional" error={fields.featuredImageUrl}>
              <input className={inputClass()} value={form.featuredImageUrl} placeholder="https://example.com/image.jpg" onChange={(event) => update("featuredImageUrl", event.target.value)} />
            </Field>
            <Field label="Campaign status">
              <select className={inputClass()} value={form.status} onChange={(event) => update("status", event.target.value as FormState["status"])}>
                {["draft", "scheduled", "active", "paused"].map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
              </select>
            </Field>
          </div>
          <button type="submit" className="mt-5 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">
            Review booking push
          </button>
        </form>

        {showSummary && (
          <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#6f7f4f]">Review & submit</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Summary label="Campaign" value={form.campaignTitle} />
              <Summary label="Hotel / room" value={`${form.hotelName} / ${form.roomType}`} />
              <Summary label="Offer" value={form.bookingOffer} />
              <Summary label="Dates" value={`${form.startDate} to ${form.endDate}`} />
              <Summary label="Rooms" value={form.availableRooms} />
              <Summary label="Audience" value={form.targetAudience} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" disabled={pending} onClick={submit} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
                {pending ? "Creating..." : "Create booking push"}
              </button>
              <button type="button" disabled={pending} onClick={() => setShowSummary(false)} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold">
                Edit
              </button>
            </div>
          </section>
        )}

        {message && (
          <p className={`mt-5 rounded-2xl p-4 text-sm font-bold ${message.startsWith("Booking push created") ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

function Field({ label, error, children, wide = false }: { label: string; error?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`grid gap-2 text-sm font-bold text-[#596540] ${wide ? "md:col-span-2" : ""}`}>
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
      <p className="mt-1 text-sm font-semibold">{value || "-"}</p>
    </div>
  );
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
