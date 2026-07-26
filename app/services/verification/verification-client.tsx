"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";

type DocumentRecord = {
  id: string;
  status: string;
  documentType: string;
  documentMetadata: unknown;
  reviewNote: string | null;
  submittedAt: string | Date;
  reviewedAt: string | Date | null;
  updatedAt: string | Date;
};

type VerificationStatus = {
  userId: string;
  profileType: string;
  verificationStatus: string;
  documents: DocumentRecord[];
  reviewNote: string | null;
};

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

export function VerificationClient({ initialStatus }: { initialStatus: VerificationStatus }) {
  const [data, setData] = useState(initialStatus);
  const [status, setStatus] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [sort, setSort] = useState("recent");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/verification/status");
      const payload = (await response.json()) as Envelope<VerificationStatus>;
      if (!payload.success) throw new Error(payload.error.message);
      setData(payload.data);
      setMessage("Verification status refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh verification status.");
    } finally {
      setLoading(false);
    }
  }

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: values.get("documentType"),
          documentMetadata: {
            fileName: values.get("fileName"),
            reference: values.get("reference"),
            storage: "metadata_only",
          },
        }),
      });
      const payload = (await response.json()) as Envelope<VerificationStatus>;
      if (!payload.success) throw new Error(payload.error.message);
      setData(payload.data);
      form.reset();
      setMessage("Document metadata submitted for verification.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit verification metadata.");
    } finally {
      setLoading(false);
    }
  }

  const visibleDocuments = useMemo(() => data.documents
    .filter((document) => (!status || document.status === status) && (!documentTypeFilter || document.documentType === documentTypeFilter))
    .sort((a, b) => {
      if (sort === "oldest") return Date.parse(String(a.submittedAt)) - Date.parse(String(b.submittedAt));
      if (sort === "pending") return Number(b.status === "pending") - Number(a.status === "pending");
      if (sort === "approved") return Number(b.status === "verified") - Number(a.status === "verified");
      return Date.parse(String(b.submittedAt)) - Date.parse(String(a.submittedAt));
    }), [data.documents, documentTypeFilter, sort, status]);

  const documentTypes = [...new Set(data.documents.map((document) => document.documentType))];
  const completed = data.documents.filter((document) => document.status === "verified").length;
  const progress = data.verificationStatus === "verified" ? 100 : data.documents.length ? Math.max(25, Math.round((completed / data.documents.length) * 100)) : 0;

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/services" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">Back to services dashboard</Link>
          <button type="button" disabled={loading} onClick={() => void refresh()} className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0] disabled:opacity-60">{loading ? "Refreshing…" : "Refresh status"}</button>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Verification center</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><h1 className="font-serif text-3xl sm:text-5xl">Service provider verification</h1><span className="rounded-full bg-[#dfe7c7] px-4 py-2 text-sm font-bold">{label(data.verificationStatus)}</span></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9dfcb]"><div className="h-full bg-[#6f7f4f]" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-xs font-semibold text-[#675f50]">{progress}% verification progress · Last update {data.documents[0] ? new Date(data.documents[0].updatedAt).toLocaleDateString() : "not submitted"}</p>
          {data.reviewNote ? <p className="mt-4 rounded-2xl bg-[#f3ecdc] p-4 text-sm"><b>Reviewer comment:</b> {data.reviewNote}</p> : null}
        </section>

        <section className="mt-5 grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 md:grid-cols-3">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass()}><option value="">All statuses</option><option value="pending">Pending</option><option value="verified">Approved</option><option value="rejected">Rejected</option><option value="needs_more_info">Needs more information</option></select>
          <select value={documentTypeFilter} onChange={(event) => setDocumentTypeFilter(event.target.value)} className={inputClass()}><option value="">All document types</option>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className={inputClass()}><option value="recent">Most recent</option><option value="oldest">Oldest</option><option value="pending">Pending first</option><option value="approved">Approved first</option></select>
        </section>

        {message ? <p className="mt-4 rounded-2xl bg-[#e9dfcb] p-3 text-sm font-semibold">{message}</p> : null}
        <section className="mt-5 grid gap-3">
          {visibleDocuments.length === 0 ? <p className="rounded-3xl bg-[#fffaf0] p-5">No verification documents match these filters.</p> : null}
          {visibleDocuments.map((document) => <article key={document.id} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{label(document.documentType)}</p><p className="mt-1 text-xs text-[#675f50]">Submitted {new Date(document.submittedAt).toLocaleString()}</p></div><span className="rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-bold">{label(document.status)}</span></div>{document.reviewNote ? <p className="mt-3 text-sm text-[#675f50]">{document.reviewNote}</p> : null}<details className="mt-3 rounded-2xl bg-[#f3ecdc] p-3 text-xs"><summary className="cursor-pointer font-bold">Review submitted metadata</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(document.documentMetadata, null, 2)}</pre></details></article>)}
        </section>

        <form onSubmit={submitDocument} className="mt-5 grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 md:grid-cols-3">
          <div className="md:col-span-3"><h2 className="font-serif text-2xl">Submit or replace document metadata</h2><p className="mt-1 text-xs text-[#675f50]">This project stores document metadata only; it does not upload identity files.</p></div>
          <input name="documentType" required placeholder="Document type" className={inputClass()} />
          <input name="fileName" required placeholder="File name" className={inputClass()} />
          <input name="reference" required placeholder="Document reference" className={inputClass()} />
          <button disabled={loading} className="w-fit rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">Submit for review</button>
        </form>
      </div>
    </main>
  );
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm text-[#1f251a]";
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
