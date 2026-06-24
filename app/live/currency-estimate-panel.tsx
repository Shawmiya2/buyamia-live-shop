"use client";

import { useMemo, useState } from "react";

type CurrencyCode = "IDR" | "USD" | "NZD" | "EUR";

type CurrencyMarket = {
  code: CurrencyCode;
  label: string;
  rateToIdr: number;
  shipping: number;
  taxRate: number;
  taxLabel: string;
  note: string;
};

const currencyMarkets: CurrencyMarket[] = [
  {
    code: "IDR",
    label: "Indonesia",
    rateToIdr: 1,
    shipping: 1250000,
    taxRate: 0.11,
    taxLabel: "VAT estimate",
    note: "Domestic demo estimate for Indonesian delivery.",
  },
  {
    code: "USD",
    label: "United States",
    rateToIdr: 16250,
    shipping: 320,
    taxRate: 0.07,
    taxLabel: "Duties and sales tax estimate",
    note: "Demo landed cost for U.S. import planning.",
  },
  {
    code: "NZD",
    label: "New Zealand",
    rateToIdr: 14850,
    shipping: 410,
    taxRate: 0.15,
    taxLabel: "GST and import estimate",
    note: "Demo landed cost for New Zealand buyers.",
  },
  {
    code: "EUR",
    label: "Europe",
    rateToIdr: 17650,
    shipping: 295,
    taxRate: 0.12,
    taxLabel: "VAT and customs estimate",
    note: "Demo landed cost for Europe-based buyers.",
  },
];

export function CurrencyEstimatePanel({
  title,
  sourceLabel,
  sourcePriceIdr,
  quantity,
  initialCurrency = "USD",
  summaryLabel,
}: {
  title: string;
  sourceLabel: string;
  sourcePriceIdr: number;
  quantity: number;
  initialCurrency?: CurrencyCode;
  summaryLabel: string;
}) {
  const [lockedLabel] = useState("session");
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);

  const market = currencyMarkets.find((item) => item.code === currency) ?? currencyMarkets[1];
  const sourceSubtotalIdr = sourcePriceIdr * quantity;
  const convertedSubtotal = sourceSubtotalIdr / market.rateToIdr;
  const shipping = market.shipping;
  const taxes = convertedSubtotal * market.taxRate;
  const totalEstimate = convertedSubtotal + shipping + taxes;

  const summaryRows = useMemo(
    () => [
      {
        label: "Source price in IDR",
        value: formatIdr(sourcePriceIdr),
        detail: `${sourceLabel} - ${quantity} unit${quantity === 1 ? "" : "s"}`,
      },
      {
        label: "Converted item subtotal",
        value: formatCurrency(market.code, convertedSubtotal),
        detail: `${market.label} selected at a fixed session rate.`,
      },
      {
        label: "Estimated shipping",
        value: formatCurrency(market.code, shipping),
        detail: market.note,
      },
      {
        label: market.taxLabel,
        value: formatCurrency(market.code, taxes),
        detail: `Calculated from the converted subtotal.`,
      },
      {
        label: "Total estimate",
        value: formatCurrency(market.code, totalEstimate),
        detail: `Selected currency: ${market.code}`,
      },
    ],
    [convertedSubtotal, currency, market.code, market.label, market.note, market.taxLabel, shipping, sourceLabel, sourcePriceIdr, quantity, taxes, totalEstimate],
  );

  return (
    <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#f3ecdc] p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#d6cbb6] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Currency summary
          </p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675f50]">
            Rates are locked when this panel loads. Changing currency updates the estimate, but the exchange snapshot stays fixed for this session.
          </p>
        </div>
        <div className="rounded-2xl bg-[#fffaf0] px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">
            Selected currency
          </p>
          <p className="mt-1 text-xl font-semibold text-[#1e2419]">{market.code}</p>
          <p className="mt-1 text-xs font-semibold text-[#675f50]">
            1 {market.code} = {formatIdr(market.rateToIdr)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-[#596540]">Choose buyer currency</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {currencyMarkets.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setCurrency(item.code)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                currency === item.code
                  ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0] shadow-lg shadow-[#8a7d61]/12"
                  : "border-[#d6cbb6] bg-[#fffaf0] text-[#1e2419] hover:border-[#6f7f4f]"
              }`}
            >
              <span className="block text-sm font-semibold">{item.code}</span>
              <span className={currency === item.code ? "mt-1 block text-xs text-[#ded8ca]" : "mt-1 block text-xs text-[#675f50]"}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryRows.map((row) => (
          <article key={row.label} className="rounded-2xl bg-[#fffaf0] p-4">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#6f7f4f]">
              {row.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#1e2419]">{row.value}</p>
            <p className="mt-2 text-xs leading-5 text-[#675f50]">{row.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-bold text-[#1e2419]">{summaryLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[#675f50]">
            Exchange rate snapshot is locked for this {lockedLabel} and refreshed only when the page reloads.
          </p>
        </div>
        <div className="w-fit rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
          Source currency: IDR
        </div>
      </div>
    </section>
  );
}

function formatIdr(value: number) {
  return `Rp ${formatThousands(value)}`;
}

function formatCurrency(currency: CurrencyCode, value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(value);
}

function formatThousands(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
