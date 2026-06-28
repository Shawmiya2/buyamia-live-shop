"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

type Reservation = {
  id: string;
  customerName: string;
  reservationAt: string;
  partySize: number;
  status: string;
  bookingReference: string;
  notes?: string | null;
  provider?: { displayName: string };
};

const statuses = [
  ["", "All statuses"],
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["rescheduled", "Rescheduled"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["no_show", "No show"],
] as const;

const sortOptions = [
  ["closest", "Closest reservation"],
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["largest_party", "Largest party size"],
] as const;

export default function RestaurantReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [filters, setFilters] = useState({ date: "", status: "", partySize: "", customerName: "", scope: "upcoming", sort: "closest" });
  const [edit, setEdit] = useState({ date: "", time: "", partySize: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function loadReservations() {
    setLoading(true);
    fetch(`/api/restaurant/reservations?${query}`)
      .then((response) => response.json())
      .then((payload: ApiEnvelope<Reservation[]>) => {
        if (payload.success) {
          setReservations(payload.data);
          setSelected((current) => current ? payload.data.find((item) => item.id === current.id) ?? null : payload.data[0] ?? null);
          if (!selected && payload.data[0]) setEditFromReservation(payload.data[0]);
        } else {
          setMessage(payload.error.message);
        }
      })
      .catch(() => setMessage("Unable to load reservations."))
      .finally(() => setLoading(false));
  }

  function setEditFromReservation(reservation: Reservation) {
    const date = new Date(reservation.reservationAt);
    setEdit({
      date: date.toISOString().slice(0, 10),
      time: date.toTimeString().slice(0, 5),
      partySize: String(reservation.partySize),
      notes: reservation.notes ?? "",
    });
  }

  function choose(reservation: Reservation) {
    setSelected(reservation);
    setEditFromReservation(reservation);
    setFields({});
    setMessage("");
  }

  async function updateReservation(input: Record<string, string | number>) {
    if (!selected) return;
    setPending(true);
    setFields({});
    setMessage("");
    try {
      const response = await fetch(`/api/restaurant/reservations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as ApiEnvelope<Reservation>;
      if (!payload.success) {
        setFields(payload.error.fields ?? {});
        throw new Error(payload.error.message);
      }
      setSelected(payload.data);
      setEditFromReservation(payload.data);
      setReservations((current) => current.map((item) => item.id === payload.data.id ? payload.data : item));
      setMessage("Reservation updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update reservation.");
    } finally {
      setPending(false);
    }
  }

  function submitReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateReservation({
      date: edit.date,
      time: edit.time,
      partySize: Number(edit.partySize),
      notes: edit.notes,
    });
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/restaurant" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to restaurant dashboard
          </Link>
          <Link href="/restaurant/create-tasting" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Create tasting
          </Link>
        </nav>

        <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Restaurant reservations</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">Adjust reservations</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Search, filter, confirm, reschedule, complete, or cancel reservations from a compact operations view.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <input className={inputClass()} placeholder="Customer name" value={filters.customerName} onChange={(event) => setFilters({ ...filters, customerName: event.target.value })} />
            <input type="date" className={inputClass()} value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
            <select className={inputClass()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input type="number" min="1" className={inputClass()} placeholder="Party size" value={filters.partySize} onChange={(event) => setFilters({ ...filters, partySize: event.target.value })} />
            <select className={inputClass()} value={filters.scope} onChange={(event) => setFilters({ ...filters, scope: event.target.value })}>
              <option value="all">All reservations</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <select className={inputClass()} value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
              {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#6f7f4f]">{loading ? "Loading reservations" : `${reservations.length} reservations`}</p>
              <button type="button" onClick={loadReservations} className="rounded-full border border-[#cabda4] px-3 py-2 text-xs font-black">Refresh</button>
            </div>
            <div className="grid gap-3">
              {reservations.map((reservation) => (
                <button key={reservation.id} type="button" onClick={() => choose(reservation)} className={`grid gap-3 rounded-2xl p-4 text-left sm:grid-cols-[1fr_auto] ${selected?.id === reservation.id ? "bg-[#edf2dd]" : "bg-[#f3ecdc]"}`}>
                  <div>
                    <p className="text-sm font-black">{reservation.customerName}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#675f50]">
                      {new Date(reservation.reservationAt).toLocaleString("en-US")} · {reservation.partySize} guests · {reservation.bookingReference}
                    </p>
                    {reservation.notes && <p className="mt-2 text-xs font-semibold leading-5 text-[#766e5e]">{reservation.notes}</p>}
                  </div>
                  <span className="h-fit rounded-full bg-[#1f251a] px-3 py-1 text-xs font-black text-[#fffaf0]">{reservation.status.replace(/_/g, " ")}</span>
                </button>
              ))}
              {!loading && !reservations.length && <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">No reservations match the current filters.</p>}
            </div>
          </section>

          <aside className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
            {selected ? (
              <div>
                <p className="text-sm font-semibold text-[#6f7f4f]">Reservation details</p>
                <h2 className="mt-2 text-2xl font-semibold">{selected.customerName}</h2>
                <div className="mt-4 grid gap-2 text-sm">
                  <Detail label="Booking reference" value={selected.bookingReference} />
                  <Detail label="Date and time" value={new Date(selected.reservationAt).toLocaleString("en-US")} />
                  <Detail label="Party size" value={`${selected.partySize} guests`} />
                  <Detail label="Status" value={selected.status.replace(/_/g, " ")} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Action label="Confirm" disabled={pending} onClick={() => updateReservation({ status: "confirmed" })} />
                  <Action label="Completed" disabled={pending} onClick={() => updateReservation({ status: "completed" })} />
                  <Action label="Cancel" disabled={pending} onClick={() => updateReservation({ status: "cancelled" })} />
                  <Action label="No show" disabled={pending} onClick={() => updateReservation({ status: "no_show" })} />
                </div>

                <form onSubmit={submitReschedule} className="mt-5 grid gap-3">
                  <p className="text-sm font-semibold text-[#6f7f4f]">Reschedule or update party</p>
                  <input type="date" className={inputClass()} value={edit.date} onChange={(event) => setEdit({ ...edit, date: event.target.value })} />
                  {fields.date && <p className="text-sm font-semibold text-[#8c3f2b]">{fields.date}</p>}
                  <input type="time" className={inputClass()} value={edit.time} onChange={(event) => setEdit({ ...edit, time: event.target.value })} />
                  <input type="number" min="1" className={inputClass()} value={edit.partySize} onChange={(event) => setEdit({ ...edit, partySize: event.target.value })} />
                  {fields.partySize && <p className="text-sm font-semibold text-[#8c3f2b]">{fields.partySize}</p>}
                  <textarea className={`${inputClass()} min-h-24`} value={edit.notes} onChange={(event) => setEdit({ ...edit, notes: event.target.value })} />
                  <button type="submit" disabled={pending} className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] disabled:opacity-60">
                    {pending ? "Updating..." : "Save changes"}
                  </button>
                </form>
                {message && <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${message.includes("success") ? "bg-[#edf2dd] text-[#596540]" : "bg-[#fff3ed] text-[#8c3f2b]"}`}>{message}</p>}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">Select a reservation to view details and actions.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f3ecdc] px-4 py-3">
      <span className="font-bold text-[#596540]">{label}</span>
      <span className="text-right font-semibold text-[#675f50]">{value}</span>
    </div>
  );
}

function Action({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-3 py-2 text-xs font-black disabled:opacity-60">
      {label}
    </button>
  );
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}
