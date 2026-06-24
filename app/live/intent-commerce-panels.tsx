"use client";

import { FormEvent, useMemo, useState } from "react";
import type { LiveEvent, LiveIntentCategory, LiveIntentQuestion, LiveIntentQuestionStatus } from "@/lib/backend/types";

const intentLabels: Record<LiveIntentCategory, string> = {
  MOQ: "MOQ",
  shipping: "Shipping",
  pricing: "Pricing",
  quality: "Quality",
  comparison: "Comparison",
  hesitation: "Hesitation",
  rejection: "Rejection",
  bundle_request: "Bundle request",
  availability: "Availability",
  policy: "Policy",
};

const statusLabels: Record<LiveIntentQuestionStatus, string> = {
  unanswered: "Unanswered",
  answered: "Answered",
  escalated: "Escalated",
};

type LiveIntentCommercePanelsProps = {
  live: LiveEvent;
  showQuestions?: boolean;
};

type QuestionForm = {
  buyerName: string;
  question: string;
};

export function LiveIntentCommercePanels({ live, showQuestions = true }: LiveIntentCommercePanelsProps) {
  return (
    <section className={showQuestions ? "mt-6 grid gap-5 xl:grid-cols-[.92fr_1.08fr]" : "mt-6 grid gap-5"}>
      <div className="grid gap-5">
        <SpecialistHostPanel live={live} />
        <CommerceDataPanel live={live} />
      </div>
      {showQuestions ? <LiveQuestionsPanel live={live} /> : null}
    </section>
  );
}

export function SpecialistHostPanel({ live }: { live: LiveEvent }) {
  const host = live.specialistHost;

  if (!host) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Specialist host</p>
          <h2 className="mt-1 text-xl font-semibold">B2B expert-led session</h2>
        </div>
        <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
          {host.hostType}
        </span>
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl bg-[#f3ecdc] p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#1e2419] px-3 py-1 text-xs font-black text-[#fffaf0]">
            {host.expertiseArea}
          </span>
          <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#596540]">
            {host.verified ? "Verified host" : "Unverified host"}
          </span>
        </div>
        <p className="text-sm leading-6 text-[#675f50]">{host.bio}</p>
      </div>
    </section>
  );
}

export function CommerceDataPanel({ live }: { live: LiveEvent }) {
  const commerce = live.commerceData;

  if (!commerce) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Commerce data</p>
          <h2 className="mt-1 text-xl font-semibold">Structured product and policy data</h2>
        </div>
        <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
          IDR source data
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#675f50]">{commerce.summary}</p>

      <div className="mt-4 grid gap-3">
        {commerce.products.map((product) => (
          <article key={`${live.id}-${product.name}-${product.variant}`} className="rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1e2419]">{product.name}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-[#6f7f4f]">{product.variant}</p>
              </div>
              {product.promotion ? (
                <span className="w-fit rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white">
                  {product.promotion}
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[#675f50] sm:grid-cols-2">
              <InfoRow label="MOQ" value={product.moq} />
              <InfoRow label="Inventory" value={product.inventory} />
              <InfoRow label="Shipping" value={product.shippingAvailability} />
              <InfoRow label="Service" value={product.serviceAvailability} />
            </div>
            <p className="mt-3 rounded-2xl bg-[#fffaf0] p-3 text-sm leading-6 text-[#675f50]">
              {product.policySummary}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniList title="Policies" items={commerce.policies} />
        <MiniList title="Service availability" items={commerce.serviceAvailability} />
      </div>
    </section>
  );
}

export function LiveQuestionsPanel({ live }: { live: LiveEvent }) {
  const initialQuestions = live.intentQuestions ?? [];
  const [form, setForm] = useState<QuestionForm>({ buyerName: "", question: "" });
  const [questions, setQuestions] = useState<LiveIntentQuestion[]>(initialQuestions);
  const [message, setMessage] = useState("");

  const questionCount = questions.length;
  const intentCounts = useMemo(
    () => questions.reduce<Record<string, number>>((accumulator, question) => {
      accumulator[question.intentCategory] = (accumulator[question.intentCategory] ?? 0) + 1;
      return accumulator;
    }, {}),
    [questions],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.question.trim()) {
      setMessage("Ask a procurement question to add it to the live queue.");
      return;
    }

    const nextQuestion: LiveIntentQuestion = {
      id: `${live.id}-local-question-${Date.now()}`,
      buyerName: form.buyerName.trim() || "Live viewer",
      question: form.question.trim(),
      timestamp: formatTimeLabel(new Date()),
      intentCategory: classifyQuestion(form.question),
      status: "unanswered",
    };

    setQuestions((current) => [nextQuestion, ...current]);
    setForm({ buyerName: "", question: "" });
    setMessage("Question added to the live Q&A list.");
  }

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Live questions</p>
          <h2 className="mt-1 text-xl font-semibold">Drop-in Q&A with intent tagging</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675f50]">
            Viewer questions are classified into procurement intent categories and kept visible for follow-up.
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
          {questionCount} questions
        </span>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl bg-[#f3ecdc] p-4">
        <div className="grid gap-3 sm:grid-cols-[.35fr_1fr]">
          <label className="grid gap-2 text-sm font-bold text-[#596540]">
            Name
            <input
              value={form.buyerName}
              onChange={(event) => setForm((current) => ({ ...current, buyerName: event.target.value }))}
              placeholder="Buyer or viewer name"
              className="rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none focus:border-[#6f7f4f]"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#596540]">
            Question
            <input
              value={form.question}
              onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
              placeholder="Ask about MOQ, shipping, pricing, quality, bundle requests..."
              className="rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none focus:border-[#6f7f4f]"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="rounded-full bg-[#1e2419] px-4 py-2.5 text-sm font-bold text-[#fffaf0]">
            Submit question
          </button>
          <span className="text-xs font-semibold text-[#675f50]">
            Demo/local state only. Questions reset on refresh.
          </span>
        </div>
        {message ? (
          <p className="rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">{message}</p>
        ) : null}
      </form>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="MOQ" value={String(intentCounts.MOQ ?? 0)} />
        <Stat label="Shipping" value={String(intentCounts.shipping ?? 0)} />
        <Stat label="Pricing" value={String(intentCounts.pricing ?? 0)} />
      </div>

      <div className="mt-4 grid gap-2">
        {questions.map((question) => (
          <article key={question.id} className="rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1e2419]">{question.buyerName}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-[#6f7f4f]">
                  {question.timestamp} - {intentLabels[question.intentCategory]}
                </p>
              </div>
              <span className={statusChipClass(question.status)}>
                {statusLabels[question.status]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#675f50]">{question.question}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-4">
      <p className="text-sm font-bold text-[#1e2419]">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <p key={item} className="rounded-xl bg-[#fffaf0] px-3 py-2 text-sm text-[#675f50]">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf0] px-3 py-2">
      <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">{label}</p>
      <p className="mt-1 font-semibold text-[#1e2419]">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf0] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[.12em] text-[#6f7f4f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1e2419]">{value}</p>
    </div>
  );
}

function classifyQuestion(question: string): LiveIntentCategory {
  const normalized = question.toLowerCase();
  if (normalized.includes("moq") || normalized.includes("minimum order")) return "MOQ";
  if (normalized.includes("ship") || normalized.includes("cif") || normalized.includes("freight")) return "shipping";
  if (normalized.includes("bundle") || normalized.includes("package")) return "bundle_request";
  if (normalized.includes("price") || normalized.includes("cost") || normalized.includes("bundle")) return "pricing";
  if (normalized.includes("quality") || normalized.includes("finish") || normalized.includes("material")) return "quality";
  if (normalized.includes("compare") || normalized.includes("compare")) return "comparison";
  if (normalized.includes("hesitat") || normalized.includes("not sure") || normalized.includes("maybe")) return "hesitation";
  if (normalized.includes("reject") || normalized.includes("not suitable")) return "rejection";
  if (normalized.includes("available") || normalized.includes("inventory") || normalized.includes("stock")) return "availability";
  return "policy";
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusChipClass(status: LiveIntentQuestionStatus) {
  if (status === "answered") {
    return "w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]";
  }

  if (status === "escalated") {
    return "w-fit rounded-full bg-[#b85438] px-3 py-1 text-xs font-black text-white";
  }

  return "w-fit rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#675f50]";
}
