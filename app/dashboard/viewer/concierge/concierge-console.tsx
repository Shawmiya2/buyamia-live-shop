"use client";

import { useState } from "react";

type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  country: string;
};

type Props = {
  addresses: Address[];
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

export function ViewerConciergeConsole({ addresses }: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);

  async function submit(formData: FormData) {
    setMessage("");
    setError("");
    const addressId = String(formData.get("addressId") ?? "");
    const body: Record<string, unknown> = {
      productOrServiceName: formData.get("productOrServiceName"),
      category: formData.get("category"),
      intentType: formData.get("intentType"),
      quantity: formData.get("quantity") || undefined,
      budgetLabel: formData.get("budgetLabel") || undefined,
      urgency: formData.get("urgency"),
      notes: formData.get("notes") || "",
      addressId: !useNewAddress && addressId ? addressId : undefined,
    };

    if (useNewAddress) {
      body.address = {
        label: formData.get("label"),
        line1: formData.get("line1"),
        line2: formData.get("line2") || undefined,
        city: formData.get("city"),
        region: formData.get("region") || undefined,
        country: formData.get("country"),
        postalCode: formData.get("postalCode") || undefined,
        isDefault: true,
      };
    }

    const response = await fetch("/api/buyer-intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as ApiEnvelope<{ id: string }>;
    if (!payload.success) {
      setError(payload.error.message);
      return;
    }
    setMessage("Buyamia Concierge captured your request.");
    window.location.reload();
  }

  return (
    <form action={submit} className="grid gap-4 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">New request</p>
        <h2 className="mt-1 text-xl font-semibold">Ask Buyamia Concierge</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Product or service name" name="productOrServiceName" required />
        <Field label="Category" name="category" required />
        <label className="text-sm font-bold text-[#596540]">
          Intent type
          <select name="intentType" className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]">
            <option value="buy_product">Buy product</option>
            <option value="book_service">Book service</option>
            <option value="request_quote">Request quote</option>
            <option value="arrange_delivery">Arrange delivery</option>
            <option value="request_concierge">Request concierge</option>
            <option value="ask_question">Ask question</option>
          </select>
        </label>
        <label className="text-sm font-bold text-[#596540]">
          Urgency
          <select name="urgency" className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]">
            <option value="today">Today</option>
            <option value="this_week">This week</option>
            <option value="flexible">Flexible</option>
          </select>
        </label>
        <Field label="Quantity" name="quantity" type="number" />
        <Field label="Budget label" name="budgetLabel" />
      </div>
      <div className="rounded-2xl bg-[#f3ecdc] p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setUseNewAddress(false)} className={`rounded-full px-4 py-2 text-xs font-bold ${!useNewAddress ? "bg-[#1e2419] text-[#fffaf0]" : "bg-white text-[#596540]"}`}>
            Saved address
          </button>
          <button type="button" onClick={() => setUseNewAddress(true)} className={`rounded-full px-4 py-2 text-xs font-bold ${useNewAddress ? "bg-[#1e2419] text-[#fffaf0]" : "bg-white text-[#596540]"}`}>
            New address
          </button>
        </div>
        {!useNewAddress && addresses.length > 0 ? (
          <select name="addressId" className="w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-sm font-semibold">
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>{address.label}: {address.city}, {address.country}</option>
            ))}
          </select>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Label" name="label" defaultValue="Home" required={useNewAddress} />
            <Field label="Line 1" name="line1" required={useNewAddress} />
            <Field label="Line 2" name="line2" />
            <Field label="City" name="city" required={useNewAddress} />
            <Field label="Region" name="region" />
            <Field label="Country" name="country" defaultValue="Indonesia" required={useNewAddress} />
            <Field label="Postal code" name="postalCode" />
          </div>
        )}
      </div>
      <label className="text-sm font-bold text-[#596540]">
        Notes
        <textarea name="notes" rows={4} className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]" />
      </label>
      <button className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
        Ask Buyamia Concierge
      </button>
      {message ? <p className="rounded-2xl bg-[#edf2dd] p-3 text-sm font-bold text-[#596540]">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">{error}</p> : null}
    </form>
  );
}

function Field({ label, name, type = "text", required = false, defaultValue = "" }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <label className="text-sm font-bold text-[#596540]">
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-white px-4 py-3 text-[#1e2419]" />
    </label>
  );
}
