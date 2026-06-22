"use client";

import { useMemo, useState } from "react";

const quantities = [24, 36, 48];
const focusOptions = ["Outdoor finish", "Cushions", "CIF Bali"];
const methods = [
  ["Apple Pay", "Fast buyer authorization"],
  ["Stripe", "Card and procurement card support"],
  ["Wire transfer", "Invoice-ready bank transfer"],
];

export function LiveHeroActions() {
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [quantity, setQuantity] = useState(36);
  const [focus, setFocus] = useState(focusOptions[0]);

  const summary = useMemo(
    () =>
      `${quantity} units, ${focus.toLowerCase()}, mixed-container RFQ queued`,
    [focus, quantity],
  );

  return (
    <div className="mt-6 max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          aria-expanded={isDraftOpen}
          onClick={() => setIsDraftOpen((open) => !open)}
          className="rounded-full bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1f251a] shadow-2xl shadow-black/10 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#fffaf0]/70 focus:ring-offset-2 focus:ring-offset-[#1f251a]"
        >
          {isDraftOpen ? "Review RFQ draft" : "Request live RFQ"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsDraftOpen(true);
            setFocus("CIF Bali");
          }}
          className="rounded-full border border-[#fffaf0]/30 bg-[#fffaf0]/14 px-5 py-3 text-sm font-bold text-[#fffaf0] shadow-2xl shadow-black/10 backdrop-blur-xl transition hover:bg-[#fffaf0]/22 focus:outline-none focus:ring-2 focus:ring-[#fffaf0]/60 focus:ring-offset-2 focus:ring-offset-[#1f251a]"
        >
          Ask assistant for landed cost
        </button>
      </div>

      {isDraftOpen && (
        <div className="mt-3 rounded-[1.35rem] border border-[#fffaf0]/22 bg-[#fffaf0]/82 p-3 text-[#1f251a] shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#596540]">
                RFQ draft synced
              </p>
              <p className="mt-1 text-sm font-semibold">{summary}</p>
            </div>
            <span className="w-fit rounded-full bg-[#6f7f4f] px-3 py-1 text-xs font-bold text-white">
              Assistant ready
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.35fr]">
            <div className="flex rounded-full bg-[#f3ecdc] p-1">
              {quantities.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuantity(item)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition ${
                    quantity === item
                      ? "bg-[#1f251a] text-[#fffaf0]"
                      : "text-[#675f50] hover:bg-[#fffaf0]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFocus(option)}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                    focus === option
                      ? "bg-[#6f7f4f] text-white"
                      : "bg-[#f3ecdc] text-[#675f50] hover:bg-[#efe5d2]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckoutControls() {
  const [mode, setMode] = useState<"buy" | "rfq">("buy");
  const [method, setMethod] = useState(methods[0][0]);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group">
        {[
          ["buy", "Buy now"],
          ["rfq", "RFQ"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value as "buy" | "rfq");
              setConfirmed(false);
            }}
            className={`rounded-full px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/45 ${
              mode === value
                ? "bg-[#1f251a] text-[#fffaf0]"
                : "bg-[#6f7f4f] text-white hover:bg-[#596540]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-2.5">
        {methods.map(([name, detail]) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setMethod(name);
              setConfirmed(false);
            }}
            className={`flex items-center justify-between gap-4 rounded-3xl px-4 py-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/45 ${
              method === name
                ? "bg-[#efe5d2] ring-1 ring-[#6f7f4f]/35"
                : "bg-[#f3ecdc]/86 hover:bg-[#efe5d2]"
            }`}
          >
            <span>
              <span className="block text-sm font-semibold">{name}</span>
              <span className="mt-1 block text-xs text-[#675f50]">
                {detail}
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-[#6f7f4f]">
              {method === name ? "Selected" : "Select"}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setConfirmed(true)}
        className="mt-5 w-full rounded-full bg-[#6f7f4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#6f7f4f]/45"
      >
        {mode === "buy" ? "Confirm buyer authorization" : "Send RFQ package"}
      </button>

      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-sm font-semibold text-[#596540]"
      >
        {confirmed
          ? mode === "buy"
            ? `${method} authorization prepared for production hold.`
            : `${method} selected for the RFQ follow-up package.`
          : `${method} selected for ${mode === "buy" ? "checkout" : "RFQ"}.`}
      </p>
    </>
  );
}
