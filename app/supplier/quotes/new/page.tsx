"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Rfq = { id: string; title: string; category: string; requirements: string };
type Product = { name: string; quantity: number; moq: number; unitPrice: number };
type Envelope<T> = { success: true; data: T } | { success: false; error: { message: string; fields?: Record<string, string> } };
const currencies = ["USD", "EUR", "GBP", "IDR", "SGD", "AUD", "JPY", "CNY"];
const fieldClass = "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm text-[#1f251a]";

export default function NewSupplierQuotePage() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [rfqId, setRfqId] = useState("");
  const [buyer, setBuyer] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [products, setProducts] = useState<Product[]>([{ name: "", quantity: 1, moq: 1, unitPrice: 0 }]);
  const [shipping, setShipping] = useState("");
  const [delivery, setDelivery] = useState("");
  const [terms, setTerms] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/supplier/quotes").then((response) => response.json()).then((payload: Envelope<Rfq[]>) => {
      if (payload.success) setRfqs(payload.data);
      else setMessage(payload.error.message);
    }).catch(() => setMessage("Unable to load available RFQs."));
  }, []);

  const total = useMemo(() => products.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [products]);
  const selectedRfq = rfqs.find((item) => item.id === rfqId);

  function updateProduct(index: number, key: keyof Product, value: string) {
    setProducts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === "name" ? value : Number(value) } : item));
  }

  async function submit(draft: boolean) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/supplier/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfqId, buyer, currency, products, shipping, estimatedDelivery: delivery, paymentTerms: terms, validUntil, notes, draft }),
      });
      const payload = (await response.json()) as Envelope<{ id: string }>;
      if (!payload.success) throw new Error(Object.values(payload.error.fields ?? {})[0] ?? payload.error.message);
      setMessage(draft ? "Quotation draft saved." : "Quotation generated and added to the protected negotiation workflow.");
      setPreview(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate quotation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6"><Link href="/dashboard/supplier" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">Back to supplier dashboard</Link></nav>
        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm"><p className="text-sm font-semibold text-[#6f7f4f]">RFQ quotation</p><h1 className="mt-2 font-serif text-3xl sm:text-5xl">Generate a commercial quote</h1></section>
        <section className="mt-5 grid gap-4 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 md:grid-cols-2">
          <select value={rfqId} onChange={(event) => setRfqId(event.target.value)} className={fieldClass}><option value="">Select an available RFQ</option>{rfqs.map((rfq) => <option key={rfq.id} value={rfq.id}>{rfq.title}</option>)}</select>
          <input value={buyer} onChange={(event) => setBuyer(event.target.value)} placeholder="Buyer or organization" className={fieldClass} />
          <select value={currency} onChange={(event) => setCurrency(event.target.value)} className={fieldClass}>{currencies.map((item) => <option key={item}>{item}</option>)}</select>
          <input value={delivery} onChange={(event) => setDelivery(event.target.value)} placeholder="Estimated delivery, e.g. 30 days" className={fieldClass} />
          <input value={shipping} onChange={(event) => setShipping(event.target.value)} placeholder="Shipping and Incoterms" className={fieldClass} />
          <input value={terms} onChange={(event) => setTerms(event.target.value)} placeholder="Payment terms" className={fieldClass} />
          <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className={fieldClass} />
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" className={fieldClass} />
          <div className="md:col-span-2 grid gap-3">
            {products.map((product, index) => <div key={index} className="grid gap-2 rounded-2xl bg-[#f3ecdc] p-3 md:grid-cols-4"><input value={product.name} onChange={(event) => updateProduct(index, "name", event.target.value)} placeholder="Product" className={fieldClass} /><input type="number" min="1" value={product.quantity} onChange={(event) => updateProduct(index, "quantity", event.target.value)} placeholder="Quantity" className={fieldClass} /><input type="number" min="1" value={product.moq} onChange={(event) => updateProduct(index, "moq", event.target.value)} placeholder="MOQ" className={fieldClass} /><input type="number" min="0.01" step="0.01" value={product.unitPrice} onChange={(event) => updateProduct(index, "unitPrice", event.target.value)} placeholder="Unit price" className={fieldClass} /></div>)}
            <button type="button" onClick={() => setProducts((current) => [...current, { name: "", quantity: 1, moq: 1, unitPrice: 0 }])} className="w-fit rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">Add product</button>
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2"><button onClick={() => setPreview(true)} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">Preview quotation</button><button disabled={pending} onClick={() => void submit(true)} className="rounded-full border border-[#cabda4] px-5 py-3 text-sm font-bold">Save draft</button></div>
        </section>
        {message ? <p className="mt-4 rounded-2xl bg-[#e9dfcb] p-3 text-sm font-semibold">{message}</p> : null}
        {preview ? <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5"><h2 className="font-serif text-2xl">Quotation preview</h2><div className="mt-4 grid gap-2 text-sm"><p><b>RFQ:</b> {selectedRfq?.title ?? "Not selected"}</p><p><b>Buyer:</b> {buyer || "Not entered"}</p>{products.map((item, index) => <p key={index}><b>{item.name || "Product"}:</b> {item.quantity} × {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(item.unitPrice)} · MOQ {item.moq}</p>)}<p><b>Total:</b> {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(total)}</p><p><b>Shipping:</b> {shipping}</p><p><b>Delivery:</b> {delivery}</p><p><b>Payment:</b> {terms}</p><p><b>Valid until:</b> {validUntil}</p></div><button disabled={pending} onClick={() => void submit(false)} className="mt-5 rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">{pending ? "Generating…" : "Generate quotation"}</button></section> : null}
      </div>
    </main>
  );
}
