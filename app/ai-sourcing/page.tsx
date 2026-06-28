"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import type { AiSourcingRecommendation } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type FormState = {
  productDescription: string;
  productCategory: string;
  quantity: string;
  targetCountry: string;
  preferredSupplierLocation: string;
  budget: string;
  moqPreference: string;
  deliveryDeadline: string;
  additionalRequirements: string;
};

const initialForm: FormState = {
  productDescription: "",
  productCategory: "",
  quantity: "",
  targetCountry: "",
  preferredSupplierLocation: "",
  budget: "",
  moqPreference: "",
  deliveryDeadline: "",
  additionalRequirements: "",
};

const categories = ["Rooms", "Furniture", "Food & Brunch", "Spa", "Facilities", "Services", "Experiences", "Restaurant", "Other"];

export default function AiSourcingPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [requestId, setRequestId] = useState("");
  const [recommendations, setRecommendations] = useState<AiSourcingRecommendation[]>([]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFields((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});
    setRecommendations([]);

    try {
      const response = await fetch("/api/ai-sourcing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          budget: form.budget ? Number(form.budget) : undefined,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ id: string; recommendations: AiSourcingRecommendation[] }>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setRequestId(payload.data.id);
      setRecommendations(payload.data.recommendations);
      setMessage("Sourcing recommendations generated from Buyamia provider data.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate sourcing recommendations.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/live" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to live room
          </Link>
          <Link href="/dashboard/main/rfqs/new" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Existing RFQ flow
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">AI sourcing</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
            Describe what you need and shortlist suppliers
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            This workspace uses local demo recommendation logic over Buyamia provider data. No external AI provider is called.
          </p>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
          <form onSubmit={submit} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product or service description" error={fields.productDescription} wide>
                <textarea className={inputClass()} rows={5} value={form.productDescription} onChange={(event) => update("productDescription", event.target.value)} />
              </Field>
              <Field label="Product category" error={fields.productCategory}>
                <select className={inputClass()} value={form.productCategory} onChange={(event) => update("productCategory", event.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="Quantity" error={fields.quantity}>
                <input className={inputClass()} type="number" min="1" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} />
              </Field>
              <Field label="Target country" error={fields.targetCountry}>
                <input className={inputClass()} value={form.targetCountry} onChange={(event) => update("targetCountry", event.target.value)} />
              </Field>
              <Field label="Preferred supplier location" error={fields.preferredSupplierLocation}>
                <input className={inputClass()} value={form.preferredSupplierLocation} placeholder="Bali, Indonesia, Vietnam..." onChange={(event) => update("preferredSupplierLocation", event.target.value)} />
              </Field>
              <Field label="Budget optional" error={fields.budget}>
                <input className={inputClass()} type="number" min="0" value={form.budget} onChange={(event) => update("budget", event.target.value)} />
              </Field>
              <Field label="MOQ preference" error={fields.moqPreference}>
                <input className={inputClass()} value={form.moqPreference} placeholder="Flexible, under 50 units, container..." onChange={(event) => update("moqPreference", event.target.value)} />
              </Field>
              <Field label="Delivery deadline" error={fields.deliveryDeadline}>
                <input className={inputClass()} type="date" value={form.deliveryDeadline} onChange={(event) => update("deliveryDeadline", event.target.value)} />
              </Field>
              <Field label="Additional requirements" error={fields.additionalRequirements} wide>
                <textarea className={inputClass()} rows={4} value={form.additionalRequirements} onChange={(event) => update("additionalRequirements", event.target.value)} />
              </Field>
            </div>
            <button type="submit" disabled={pending} className="mt-5 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
              {pending ? "Generating recommendations..." : "Generate recommendations"}
            </button>
            {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${recommendations.length ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>{message}</p>}
          </form>

          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6f7f4f]">Recommendations</p>
                <h2 className="mt-1 text-2xl font-semibold">Supplier shortlist</h2>
              </div>
              {requestId && <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">Request saved</span>}
            </div>
            <div className="mt-4 grid gap-3">
              {recommendations.length ? recommendations.map((recommendation) => (
                <article key={recommendation.supplierId} className="rounded-2xl bg-[#f3ecdc] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.14em] text-[#6f7f4f]">{formatLabel(recommendation.supplierType)}</p>
                      <h3 className="mt-2 text-lg font-semibold">{recommendation.supplierName}</h3>
                      <p className="mt-1 text-sm font-semibold text-[#675f50]">{recommendation.country} - {recommendation.productCategory}</p>
                    </div>
                    <span className="w-fit rounded-full bg-[#1f251a] px-3 py-1 text-xs font-black text-[#fffaf0]">Trust {recommendation.trustScore}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{recommendation.estimatedResponseTime}</Badge>
                    <Badge>{recommendation.moq}</Badge>
                    <Badge>{recommendation.rfqAvailable ? "RFQ ready" : "RFQ unavailable"}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#675f50]">{recommendation.suggestedNextAction}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={recommendation.supplierHref} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">Open supplier profile</Link>
                    <Link href={recommendation.rfqHref} className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">Continue to RFQ</Link>
                  </div>
                </article>
              )) : (
                <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
                  Submit a sourcing request to generate a local demo shortlist.
                </p>
              )}
            </div>
          </section>
        </div>
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

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#596540]">{children}</span>;
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
