"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  providerName: string | null;
  productOrServiceName: string;
  category: string;
  intentType: string;
  quantity: number | null;
  budgetLabel: string | null;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  outcomes: {
    id: string;
    status: string;
    outcomeType: string;
    summary: string;
  }[];
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

const terminalStatuses = new Set(["completed", "cancelled"]);

function bookingReference(id: string) {
  return `BYM-${id.slice(-8).toUpperCase()}`;
}

function localDate(isoDate: string) {
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

export function ViewerBookingsConsole() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [date, setDate] = useState("");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState("upcoming");

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/buyer-intents", { cache: "no-store" });
      const payload = (await response.json()) as ApiEnvelope<Booking[]>;
      if (!payload.success) {
        throw new Error(payload.error.message);
      }

      const viewerBookings = payload.data.filter((item) => item.intentType === "book_service");
      setBookings(viewerBookings);
      setSelectedId((current) =>
        viewerBookings.some((item) => item.id === current) ? current : (viewerBookings[0]?.id ?? ""),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  const statuses = useMemo(
    () => [...new Set(bookings.map((booking) => booking.status))].sort(),
    [bookings],
  );
  const types = useMemo(
    () => [...new Set(bookings.map((booking) => booking.category))].sort(),
    [bookings],
  );
  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = bookings.filter((booking) => {
      const isPast = terminalStatuses.has(booking.status);
      const matchesSearch =
        !normalizedSearch ||
        [
          bookingReference(booking.id),
          booking.providerName ?? "",
          booking.productOrServiceName,
          booking.category,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return (
        matchesSearch &&
        (status === "all" || booking.status === status) &&
        (type === "all" || booking.category === type) &&
        (!date || localDate(booking.createdAt) === date) &&
        (scope === "all" || (scope === "upcoming" ? !isPast : isPast))
      );
    });

    return filtered.sort((left, right) => {
      if (sort === "alphabetical") {
        return left.productOrServiceName.localeCompare(right.productOrServiceName);
      }
      if (sort === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }
      if (sort === "recent") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      const leftPast = terminalStatuses.has(left.status) ? 1 : 0;
      const rightPast = terminalStatuses.has(right.status) ? 1 : 0;
      return leftPast - rightPast || new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
  }, [bookings, date, scope, search, sort, status, type]);

  const selected =
    filteredBookings.find((booking) => booking.id === selectedId) ??
    filteredBookings[0] ??
    null;

  return (
    <>
      <section className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#e9dfcb] p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold text-[#596540]">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Reference, provider, or service"
              className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-[#1e2419]"
            />
          </label>
          <Filter label="Status" value={status} onChange={setStatus}>
            <option value="all">All statuses</option>
            {statuses.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
          </Filter>
          <Filter label="Booking type" value={type} onChange={setType}>
            <option value="all">All booking types</option>
            {types.map((item) => <option key={item} value={item}>{item}</option>)}
          </Filter>
          <label className="text-sm font-bold text-[#596540]">
            Booking request date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-[#1e2419]"
            />
          </label>
          <Filter label="Timing" value={scope} onChange={setScope}>
            <option value="all">All bookings</option>
            <option value="upcoming">Upcoming bookings</option>
            <option value="past">Past bookings</option>
          </Filter>
          <Filter label="Sort" value={sort} onChange={setSort}>
            <option value="upcoming">Upcoming first</option>
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
            <option value="alphabetical">Alphabetical</option>
          </Filter>
        </div>
      </section>

      {error ? (
        <section className="mt-5 rounded-3xl border border-[#e0b7aa] bg-[#fff3ed] p-5 text-[#8c3f2b]">
          <p className="font-bold">Bookings could not be loaded.</p>
          <p className="mt-2 text-sm">{error}</p>
          <button type="button" onClick={() => void loadBookings()} className="mt-4 rounded-full bg-[#8c3f2b] px-4 py-2 text-sm font-bold text-white">
            Try again
          </button>
        </section>
      ) : null}

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">My bookings</p>
              <h2 className="mt-1 text-xl font-semibold">
                {loading ? "Loading bookings" : `${filteredBookings.length} booking${filteredBookings.length === 1 ? "" : "s"}`}
              </h2>
            </div>
            {!loading && !error ? <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-bold text-[#596540]">Updated</span> : null}
          </div>

          <div className="grid gap-3">
            {loading ? (
              [0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-[#f3ecdc]" />)
            ) : filteredBookings.length ? (
              filteredBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelectedId(booking.id)}
                  className={`grid gap-3 rounded-2xl p-4 text-left sm:grid-cols-[1fr_auto] ${
                    selected?.id === booking.id ? "bg-[#edf2dd]" : "bg-[#f3ecdc]"
                  }`}
                >
                  <div>
                    <p className="font-bold">{booking.productOrServiceName}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[.1em] text-[#6f7f4f]">
                      {bookingReference(booking.id)}
                    </p>
                    <p className="mt-2 text-sm text-[#675f50]">
                      {booking.providerName ?? "Provider pending"} · {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-[#1e2419] px-3 py-1 text-xs font-black text-[#fffaf0]">
                    {humanize(booking.status)}
                  </span>
                </button>
              ))
            ) : !error ? (
              <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">
                No bookings match the current filters.
              </p>
            ) : null}
          </div>
        </div>

        <aside className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Booking details</p>
          {selected ? (
            <>
              <h2 className="mt-2 text-xl font-semibold">{selected.productOrServiceName}</h2>
              <div className="mt-5 grid gap-3">
                <Detail label="Booking reference" value={bookingReference(selected.id)} />
                <Detail label="Provider name" value={selected.providerName ?? "Provider pending"} />
                <Detail label="Booking type" value={selected.category} />
                <Detail label="Booking date" value={new Date(selected.createdAt).toLocaleDateString()} />
                <Detail label="Booking time" value={new Date(selected.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                <Detail label="Booking status" value={humanize(selected.status)} />
                <Detail label="Participants" value={selected.quantity ? String(selected.quantity) : "Not provided"} />
                <Detail label="Total price" value={selected.budgetLabel ?? "Not provided"} />
              </div>
              {selected.notes ? <p className="mt-4 rounded-2xl bg-[#f3ecdc] p-4 text-sm leading-6 text-[#675f50]">{selected.notes}</p> : null}
              {selected.outcomes.length ? (
                <div className="mt-4 rounded-2xl bg-[#edf2dd] p-4">
                  <p className="text-xs font-black uppercase tracking-[.12em] text-[#596540]">Latest outcome</p>
                  <p className="mt-2 text-sm leading-6">{selected.outcomes.at(-1)?.summary}</p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-4 rounded-2xl bg-[#f3ecdc] p-4 text-sm text-[#675f50]">
              Select a booking to view its details.
            </p>
          )}
        </aside>
      </section>
    </>
  );
}

function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-bold text-[#596540]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-[#1e2419]"
      >
        {children}
      </select>
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-3">
      <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
