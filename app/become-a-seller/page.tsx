"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, type ReactNode, useMemo, useState } from "react";
import type { SellerApplicationDocumentMetadata, SellerApplicationInput } from "@/lib/backend/types";

const businessTypes = [
  ["hotel", "Hotel"],
  ["restaurant", "Restaurant"],
  ["supplier", "Supplier"],
  ["service_provider", "Service Provider"],
] as const;
const categoryOptions = ["Rooms", "Restaurant", "Furniture", "Spa", "Facilities", "Services", "Experiences", "Food & Brunch", "Other"];
const documentTypes = ["Business registration", "Tax document", "Identity document", "Other supporting document"];

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

const initialForm: SellerApplicationInput = {
  businessName: "",
  businessType: "supplier",
  country: "",
  contactPerson: "",
  businessEmail: "",
  phoneNumber: "",
  companyDescription: "",
  categories: [],
  productsOrServices: "",
  website: "",
  verificationDocuments: [],
};

export default function BecomeSellerPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SellerApplicationInput>(initialForm);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const selectedCategories = useMemo(() => new Set(form.categories), [form.categories]);

  function update<K extends keyof SellerApplicationInput>(key: K, value: SellerApplicationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFields((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function toggleCategory(category: string) {
    update(
      "categories",
      selectedCategories.has(category)
        ? form.categories.filter((item) => item !== category)
        : [...form.categories, category],
    );
  }

  function onFiles(documentType: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const uploadedAt = new Date().toISOString();
    update("verificationDocuments", [
      ...form.verificationDocuments.filter((document) => document.documentType !== documentType),
      ...files.map((file): SellerApplicationDocumentMetadata => ({
        documentType,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        uploadedAt,
      })),
    ]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});

    try {
      const response = await fetch("/api/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "submitted" }),
      });
      const payload = (await response.json()) as ApiEnvelope<{ id: string }>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setMessage("Application submitted. Buyamia will review your business verification metadata.");
      setForm(initialForm);
      setStep(4);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit seller application.");
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
          <Link href="/signup" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Existing signup
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Seller onboarding</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
            Apply to sell through Buyamia Live
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Submit business details and verification metadata for Hotel, Restaurant, Supplier, or Service Provider seller review.
          </p>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {["Business", "Details", "Verification", "Review"].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index + 1)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-black ${
                step === index + 1
                  ? "border-[#1f251a] bg-[#1f251a] text-[#fffaf0]"
                  : "border-[#d6cbb6] bg-[#fffaf0] text-[#596540]"
              }`}
            >
              Step {index + 1}<span className="block font-semibold">{label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name" error={fields.businessName}>
                <input className={inputClass()} value={form.businessName} onChange={(event) => update("businessName", event.target.value)} />
              </Field>
              <Field label="Business type" error={fields.businessType}>
                <select className={inputClass()} value={form.businessType} onChange={(event) => update("businessType", event.target.value as SellerApplicationInput["businessType"])}>
                  {businessTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Country" error={fields.country}>
                <input className={inputClass()} value={form.country} onChange={(event) => update("country", event.target.value)} />
              </Field>
              <Field label="Contact person" error={fields.contactPerson}>
                <input className={inputClass()} value={form.contactPerson} onChange={(event) => update("contactPerson", event.target.value)} />
              </Field>
              <Field label="Business email" error={fields.businessEmail}>
                <input className={inputClass()} type="email" value={form.businessEmail} onChange={(event) => update("businessEmail", event.target.value)} />
              </Field>
              <Field label="Phone number" error={fields.phoneNumber}>
                <input className={inputClass()} value={form.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <Field label="Company description" error={fields.companyDescription}>
                <textarea className={inputClass()} rows={5} value={form.companyDescription} onChange={(event) => update("companyDescription", event.target.value)} />
              </Field>
              <Field label="Categories" error={fields.categories}>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`rounded-full px-3 py-2 text-xs font-bold ${selectedCategories.has(category) ? "bg-[#1f251a] text-[#fffaf0]" : "bg-[#f3ecdc] text-[#596540]"}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Products or services offered" error={fields.productsOrServices}>
                <textarea className={inputClass()} rows={4} value={form.productsOrServices} onChange={(event) => update("productsOrServices", event.target.value)} />
              </Field>
              <Field label="Website optional" error={fields.website}>
                <input className={inputClass()} value={form.website ?? ""} placeholder="https://example.com" onChange={(event) => update("website", event.target.value)} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
                Files are not uploaded yet. Buyamia stores document metadata only until document storage is connected.
              </p>
              {documentTypes.map((documentType) => (
                <Field key={documentType} label={documentType} error={fields.verificationDocuments}>
                  <input className={inputClass()} type="file" onChange={(event) => onFiles(documentType, event)} />
                </Field>
              ))}
              <div className="grid gap-2">
                {form.verificationDocuments.map((document) => (
                  <p key={`${document.documentType}-${document.fileName}`} className="rounded-2xl bg-[#f3ecdc] p-3 text-sm font-semibold">
                    {document.documentType}: {document.fileName}
                  </p>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4">
              <Summary label="Business" value={`${form.businessName || "-"} / ${labelForBusinessType(form.businessType)}`} />
              <Summary label="Contact" value={`${form.contactPerson || "-"} / ${form.businessEmail || "-"}`} />
              <Summary label="Categories" value={form.categories.length ? form.categories.join(", ") : "-"} />
              <Summary label="Documents" value={`${form.verificationDocuments.length} metadata record(s)`} />
              <button type="submit" disabled={pending} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
                {pending ? "Submitting..." : "Submit application"}
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold">Previous</button>}
            {step < 4 && <button type="button" onClick={() => setStep(step + 1)} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">Next</button>}
          </div>
          {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${message.startsWith("Application submitted") ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>{message}</p>}
        </form>
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

function labelForBusinessType(value: SellerApplicationInput["businessType"]) {
  return businessTypes.find(([current]) => current === value)?.[1] ?? value;
}
