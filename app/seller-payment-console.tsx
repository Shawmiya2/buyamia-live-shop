"use client";

import { useMemo, useState } from "react";

const streamDays = [
  { label: "Mon", type: "weekday", price: 49 },
  { label: "Tue", type: "weekday", price: 49 },
  { label: "Wed", type: "weekday", price: 49 },
  { label: "Thu", type: "weekday", price: 49 },
  { label: "Fri", type: "weekday", price: 49 },
  { label: "Sat", type: "weekend", price: 79 },
  { label: "Sun", type: "weekend", price: 79 },
];

const bookingActions = [
  "Start live now",
  "Schedule later",
  "Launch overstock live",
];

export function SellerPaymentConsole() {
  const [selectedDay, setSelectedDay] = useState(streamDays[0]);
  const [paymentValidated, setPaymentValidated] = useState(false);
  const [selectedAction, setSelectedAction] = useState(bookingActions[1]);

  const packageLabel = useMemo(
    () =>
      selectedDay.type === "weekend"
        ? "Weekend premium 30 min live package"
        : "Weekday 30 min live package",
    [selectedDay.type],
  );

  return (
    <section id="seller-payment" className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Seller paid live booking
            </p>
            <h2 className="mt-2 max-w-4xl font-serif text-2xl leading-tight sm:text-4xl">
              Suppliers pay, validate, then go live or schedule a 30 min stream.
            </h2>
          </div>
          <span className="w-fit rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#596540] shadow-sm">
            QR payment ready
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-xl shadow-[#8a7d61]/8 sm:p-6">
            <div className="grid gap-2 sm:grid-cols-7">
              {streamDays.map((day) => (
                <button
                  key={day.label}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    setPaymentValidated(false);
                  }}
                  className={`rounded-2xl border px-3 py-3 text-center transition ${
                    selectedDay.label === day.label
                      ? "border-[#6f7f4f] bg-[#f3ecdc] shadow-sm"
                      : "border-[#ded4c2] bg-white/50 hover:bg-[#f6efe2]"
                  }`}
                >
                  <span className="block text-sm font-bold">{day.label}</span>
                  <span className="mt-1 block text-xs text-[#675f50]">
                    ${day.price}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
              <div className="rounded-[1.5rem] bg-[#1f251a] p-5 text-[#fffaf0]">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                  {packageLabel}
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  ${selectedDay.price}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#ded7c9]">
                  Includes live room placement, seller dashboard, product pins,
                  RFQ capture, AI recap, and replay summary.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {["30 min", "AI recap", "RFQ leads", "Replay"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#fffaf0]/10 px-3 py-2 text-center text-xs font-bold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-[#f3ecdc] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                      QR payment
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      Scan to unlock seller live controls.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#675f50]">
                      Payment validation unlocks instant start, scheduled live,
                      and urgent overstock streams.
                    </p>
                  </div>
                  <div className="grid size-28 shrink-0 grid-cols-5 gap-1 rounded-2xl bg-[#fffaf0] p-3 shadow-sm">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <span
                        key={index}
                        className={`rounded-[3px] ${
                          [0, 1, 2, 5, 10, 12, 14, 16, 18, 20, 22, 23, 24].includes(
                            index,
                          )
                            ? "bg-[#1f251a]"
                            : "bg-[#d6cbb6]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentValidated(true)}
                  className="mt-5 w-full rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                >
                  Validate payment
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#cbd8a7]">
                  Seller dashboard
                </p>
                <h3 className="mt-2 font-serif text-2xl leading-tight">
                  Live booking status and next action.
                </h3>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${
                  paymentValidated
                    ? "bg-[#cbd8a7] text-[#1f251a]"
                    : "bg-[#fffaf0]/12 text-[#fffaf0]"
                }`}
              >
                {paymentValidated ? "Paid" : "Pending"}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {bookingActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={!paymentValidated}
                  onClick={() => setSelectedAction(action)}
                  className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                    selectedAction === action && paymentValidated
                      ? "border-[#cbd8a7] bg-white/[.12]"
                      : "border-white/10 bg-white/[.06]"
                  } ${paymentValidated ? "hover:bg-white/[.1]" : "opacity-55"}`}
                >
                  <span className="block text-sm font-semibold">{action}</span>
                  <span className="mt-1 block text-xs text-[#ded7c9]">
                    {action === "Start live now"
                      ? "Open the room immediately after validation."
                      : action === "Schedule later"
                        ? "Reserve a future slot and invite buyers."
                        : "Sell urgent wholesale inventory with flash pricing."}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] bg-[#fffaf0]/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                Ready state
              </p>
              <p className="mt-2 text-sm leading-6 text-[#ded7c9]">
                {paymentValidated
                  ? `${selectedAction} is unlocked for ${selectedDay.label}.`
                  : "Validate QR payment to unlock live controls."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
