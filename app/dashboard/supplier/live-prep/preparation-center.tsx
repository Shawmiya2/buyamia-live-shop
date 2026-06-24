"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PrepItem = {
  id: string;
  label: string;
  detail: string;
  group: "pre-live" | "product-demo";
};

const lightingGuide = [
  "Face a window or soft front light so product texture is visible.",
  "Avoid strong backlight behind the presenter or product table.",
  "Use one warm side light for rattan, wood, stone, or fabric details.",
];

const framingGuide = [
  "Keep the product in the center third of the frame.",
  "Leave enough space for hands, labels, and sample materials.",
  "Prepare one wide workshop angle and one close product detail angle.",
];

const scriptTemplates = [
  {
    title: "Opening",
    body: "Welcome buyers, state the product category, and explain what proof they will see live.",
  },
  {
    title: "MOQ and terms",
    body: "Explain minimum order quantity, mixed-container options, sample policy, lead time, and shipping route.",
  },
  {
    title: "RFQ close",
    body: "Invite buyers to request samples, submit an RFQ, or ask for CIF pricing after the Q&A.",
  },
];

const recommendedStructure = [
  "Introduction",
  "Factory/workshop overview",
  "Product demo",
  "MOQ and shipping explanation",
  "Q&A",
  "RFQ / sample request call-to-action",
];

const prepItems: PrepItem[] = [
  {
    id: "light-source",
    label: "Set front lighting",
    detail: "Presenter and product surface are evenly lit before going live.",
    group: "pre-live",
  },
  {
    id: "camera-frame",
    label: "Lock camera framing",
    detail: "Main product, hands, and workshop proof stay inside the frame.",
    group: "pre-live",
  },
  {
    id: "audio-check",
    label: "Run audio check",
    detail: "Supplier voice, translation context, and workshop noise are clear.",
    group: "pre-live",
  },
  {
    id: "rfq-script",
    label: "Prepare RFQ script",
    detail: "MOQ, sample, warranty, and shipping prompts are ready.",
    group: "pre-live",
  },
  {
    id: "hero-sku",
    label: "Select hero product",
    detail: "Lead SKU has price range, dimensions, finish, and MOQ ready.",
    group: "product-demo",
  },
  {
    id: "proof-materials",
    label: "Stage proof materials",
    detail: "Certifications, packing proof, and production photos are nearby.",
    group: "product-demo",
  },
  {
    id: "shipping-sample",
    label: "Prepare shipping explanation",
    detail: "Sample, CIF, container, and scheduled delivery options are clear.",
    group: "product-demo",
  },
  {
    id: "qa-owner",
    label: "Assign Q&A owner",
    detail: "Someone tracks buyer questions and marks RFQ-ready leads.",
    group: "product-demo",
  },
];

const aiTips = [
  "Start with proof before pricing: show workshop, materials, and quality checks first.",
  "Repeat MOQ and sample rules before Q&A so buyers understand the next step.",
  "Pause after each demo section to let the assistant capture RFQ details.",
  "Mention trust signals naturally: certifications, completed orders, and response SLA.",
];

export function SupplierLivePreparationCenter() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const completedCount = useMemo(
    () => prepItems.filter((item) => completed[item.id]).length,
    [completed],
  );
  const progress = Math.round((completedCount / prepItems.length) * 100);

  function toggle(id: string) {
    setCompleted((current) => ({ ...current, [id]: !current[id] }));
  }

  function markAll(group?: PrepItem["group"]) {
    setCompleted((current) => {
      const next = { ...current };
      for (const item of prepItems) {
        if (!group || item.group === group) {
          next[item.id] = true;
        }
      }
      return next;
    });
  }

  function resetAll() {
    setCompleted({});
  }

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                Supplier studio
              </p>
              <h1 className="mt-1 font-serif text-4xl leading-tight">
                Live Preparation Center
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#675f50]">
                Prepare a supplier live with lighting, framing, script prompts,
                product proof, MOQ terms, shipping explanation, and RFQ handoff.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/supplier" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
                Supplier dashboard
              </Link>
              <Link href="/live" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">
                View live room
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center justify-between gap-3 text-sm font-bold">
                <span>Preparation progress</span>
                <span>{completedCount}/{prepItems.length} complete</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-[#ded4c2]">
                <div className="h-3 rounded-full bg-[#6f7f4f]" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => markAll()} className="rounded-full bg-[#6f7f4f] px-4 py-2 text-xs font-bold text-white">
                Mark all complete
              </button>
              <button type="button" onClick={resetAll} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold">
                Reset
              </button>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
          <GuidePanel title="Lighting guide" items={lightingGuide} />
          <GuidePanel title="Camera framing guide" items={framingGuide} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <ChecklistPanel
            title="Pre-live checklist"
            group="pre-live"
            completed={completed}
            onToggle={toggle}
            onMarkGroup={markAll}
          />
          <ChecklistPanel
            title="Product demo checklist"
            group="product-demo"
            completed={completed}
            onToggle={toggle}
            onMarkGroup={markAll}
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[.92fr_1.08fr]">
          <ScriptTemplates />
          <RecommendedStructure />
        </section>

        <section className="mt-5 rounded-3xl border border-[#1e2419] bg-[#1e2419] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                AI tips
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Improve the live before buyers arrive
              </h2>
            </div>
            <span className="w-fit rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold text-[#cbd8a7]">
              Demo guidance
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {aiTips.map((tip) => (
              <p key={tip} className="rounded-2xl bg-white/[.07] p-4 text-sm leading-6 text-[#ded8ca]">
                {tip}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function GuidePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
        Setup guide
      </p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-2xl bg-[#f3ecdc] p-4">
            <p className="text-xs font-bold text-[#6f7f4f]">0{index + 1}</p>
            <p className="mt-2 text-sm leading-6 text-[#675f50]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChecklistPanel({
  title,
  group,
  completed,
  onToggle,
  onMarkGroup,
}: {
  title: string;
  group: PrepItem["group"];
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
  onMarkGroup: (group: PrepItem["group"]) => void;
}) {
  const items = prepItems.filter((item) => item.group === group);
  const done = items.filter((item) => completed[item.id]).length;

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Checklist
          </p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        <button type="button" onClick={() => onMarkGroup(group)} className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-bold text-[#596540]">
          {done}/{items.length}
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <label key={item.id} className="flex gap-3 rounded-2xl bg-[#f3ecdc] p-4">
            <input
              type="checkbox"
              checked={Boolean(completed[item.id])}
              onChange={() => onToggle(item.id)}
              className="mt-1 size-4 accent-[#6f7f4f]"
            />
            <span>
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[#675f50]">{item.detail}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

function ScriptTemplates() {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
        Script templates
      </p>
      <h2 className="mt-1 text-xl font-semibold">Supplier talking points</h2>
      <div className="mt-4 grid gap-3">
        {scriptTemplates.map((template) => (
          <article key={template.title} className="rounded-2xl bg-[#f3ecdc] p-4">
            <p className="font-semibold">{template.title}</p>
            <p className="mt-2 text-sm leading-6 text-[#675f50]">{template.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendedStructure() {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
        Recommended live structure
      </p>
      <h2 className="mt-1 text-xl font-semibold">From proof to RFQ</h2>
      <div className="mt-4 grid gap-3">
        {recommendedStructure.map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl bg-[#f3ecdc] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1e2419] text-xs font-black text-[#fffaf0]">
              {index + 1}
            </span>
            <p className="text-sm font-semibold">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
