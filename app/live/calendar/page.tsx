import type { Metadata } from "next";
import Link from "next/link";
import { getLiveDetailsById } from "@/lib/backend/live-service";
import { listCalendarEvents } from "@/lib/backend/procurement-service";
import type { CalendarEvent, ProfileType } from "@/lib/backend/types";

type SearchParams = {
  category?: string | string[];
  role?: string | string[];
  status?: string | string[];
  providerId?: string | string[];
  date?: string | string[];
  month?: string | string[];
  selected?: string | string[];
};

const partnerRoles: Array<Exclude<ProfileType, "main_admin" | "viewer">> = [
  "supplier",
  "hotel",
  "restaurant",
  "service_provider",
];

export const metadata: Metadata = {
  title: "Live Calendar",
  description: "Browse Buyamia scheduled live streams by month, category, provider, and date.",
};

export default async function LiveCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = normalizeFilters(params);
  const allEvents = await listCalendarEvents({ type: "scheduled_live" });
  const events = await listCalendarEvents({
    type: "scheduled_live",
    category: filters.category,
    role: filters.role,
    status: filters.status,
    providerId: filters.providerId,
    from: filters.from,
    to: filters.to,
  });
  const month = parseMonth(filters.month);
  const todayEvents = events.filter((event) => isSameDay(new Date(event.date), new Date()));
  const selectedEvent =
    events.find((event) => event.id === filters.selected) ??
    events.find((event) => isSameMonth(new Date(event.date), month)) ??
    events[0];
  const selectedLive =
    selectedEvent?.liveId ? await getLiveDetailsById(selectedEvent.liveId) : null;
  const categoryOptions = unique(allEvents.map((event) => event.category));
  const providerOptions = uniqueBy(
    allEvents.filter((event) => event.providerId && event.providerName),
    (event) => event.providerId!,
  );
  const monthEvents = events.filter((event) => isSameMonth(new Date(event.date), month));

  return (
    <main className="min-h-screen bg-[#f3ecdc] px-5 py-6 text-[#1f251a] sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/live" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">
            Back to live room
          </Link>
          <Link href="/live?status=scheduled" className="rounded-full bg-[#1f251a] px-4 py-2 text-sm font-bold text-[#fffaf0]">
            Upcoming sessions
          </Link>
        </nav>

        <section className="mb-6">
          <p className="text-sm font-semibold text-[#6f7f4f]">Live calendar</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
            Scheduled Buyamia live streams
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#675f50]">
            Browse upcoming rooms by month, provider type, category, and date.
          </p>
        </section>

        <form action="/live/calendar" className="mb-6 grid gap-3 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4 md:grid-cols-3 lg:grid-cols-6">
          <Select name="category" label="Category" value={filters.category} options={["all", ...categoryOptions]} />
          <Select name="role" label="Provider type" value={filters.role} options={["all", ...partnerRoles]} />
          <Select
            name="providerId"
            label="Provider"
            value={filters.providerId}
            options={["all", ...providerOptions.map((event) => event.providerId!)]}
            labels={Object.fromEntries(providerOptions.map((event) => [event.providerId!, event.providerName!]))}
          />
          <Select name="status" label="Live status" value={filters.status} options={["all", "scheduled"]} />
          <label className="grid gap-1 text-xs font-black uppercase tracking-[.12em] text-[#6f7f4f]">
            Date
            <input name="date" type="date" defaultValue={filters.date} className={inputClass()} />
          </label>
          <div className="grid content-end">
            <button type="submit" className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0]">
              Apply filters
            </button>
          </div>
        </form>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#6f7f4f]">Monthly view</p>
                <h2 className="mt-1 text-xl font-semibold">
                  {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
                </h2>
              </div>
              <div className="flex gap-2">
                <Link href={calendarHref(filters, { month: addMonths(month, -1) })} className="rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">
                  Previous
                </Link>
                <Link href={calendarHref(filters, { month: new Date() })} className="rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">
                  Today
                </Link>
                <Link href={calendarHref(filters, { month: addMonths(month, 1) })} className="rounded-full border border-[#cabda4] px-4 py-2 text-sm font-bold">
                  Next
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[.12em] text-[#6f7f4f]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarCells(month).map((cell, index) => {
                const dayEvents = cell ? monthEvents.filter((event) => isSameDay(new Date(event.date), cell)) : [];
                return (
                  <div key={cell?.toISOString() ?? `blank-${index}`} className="min-h-28 rounded-2xl border border-[#d6cbb6] bg-[#f3ecdc] p-2">
                    {cell ? (
                      <>
                        <p className="text-sm font-black">{cell.getDate()}</p>
                        <div className="mt-2 grid gap-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <Link
                              key={event.id}
                              href={calendarHref(filters, { selected: event.id })}
                              className="rounded-xl bg-[#fffaf0] px-2 py-1 text-left text-[11px] font-bold leading-4 text-[#1f251a]"
                            >
                              {event.title.replace("Scheduled live: ", "")}
                            </Link>
                          ))}
                          {dayEvents.length > 3 ? <span className="text-[11px] font-bold text-[#675f50]">+{dayEvents.length - 3} more</span> : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="grid gap-4">
            <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
              <p className="text-sm font-semibold text-[#6f7f4f]">Today</p>
              <h2 className="mt-1 text-xl font-semibold">Today's live streams</h2>
              <EventList events={todayEvents} filters={filters} empty="No scheduled lives today." />
            </section>

            <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-4">
              <p className="text-sm font-semibold text-[#6f7f4f]">Upcoming</p>
              <h2 className="mt-1 text-xl font-semibold">Next scheduled streams</h2>
              <EventList events={events.slice(0, 8)} filters={filters} empty="No upcoming streams match these filters." />
            </section>

            <section className="rounded-3xl border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0]">
              <p className="text-sm font-semibold text-[#d8e3b8]">Selected stream</p>
              {selectedEvent && selectedLive ? (
                <>
                  <h2 className="mt-2 text-2xl font-semibold">{selectedLive.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#e8ddc8]">
                    {selectedLive.providerName} - {formatLabel(selectedLive.providerRole)} - {formatDateTime(selectedEvent.date)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">{selectedLive.category}</span>
                    <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">{formatLabel(selectedLive.status)}</span>
                    <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold">Trust {selectedLive.trustScore.score}</span>
                  </div>
                  <Link href={`/live/${selectedLive.id}`} className="mt-5 inline-flex rounded-full bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1f251a]">
                    Open stream detail
                  </Link>
                </>
              ) : (
                <p className="mt-3 text-sm text-[#e8ddc8]">Select a scheduled stream from the calendar.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Select({
  name,
  label,
  value,
  options,
  labels = {},
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase tracking-[.12em] text-[#6f7f4f]">
      {label}
      <select name={name} defaultValue={value} className={inputClass()}>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function EventList({
  events,
  filters,
  empty,
}: {
  events: CalendarEvent[];
  filters: NormalizedFilters;
  empty: string;
}) {
  return (
    <div className="mt-3 grid gap-2">
      {events.length ? events.map((event) => (
        <Link key={event.id} href={calendarHref(filters, { selected: event.id })} className="rounded-2xl bg-[#f3ecdc] p-3">
          <p className="text-sm font-semibold">{event.title.replace("Scheduled live: ", "")}</p>
          <p className="mt-1 text-xs font-semibold text-[#675f50]">
            {event.providerName} - {formatDateTime(event.date)}
          </p>
        </Link>
      )) : (
        <p className="rounded-2xl bg-[#f3ecdc] p-3 text-sm font-semibold text-[#675f50]">{empty}</p>
      )}
    </div>
  );
}

type NormalizedFilters = {
  category: string;
  role: string;
  status: string;
  providerId: string;
  date: string;
  month: string;
  selected: string;
  from?: string;
  to?: string;
};

function normalizeFilters(params: SearchParams): NormalizedFilters {
  const date = firstString(params.date);
  return {
    category: firstString(params.category) || "all",
    role: firstString(params.role) || "all",
    status: firstString(params.status) || "all",
    providerId: firstString(params.providerId) || "all",
    date,
    month: firstString(params.month) || monthValue(new Date()),
    selected: firstString(params.selected),
    from: date ? startOfDay(date).toISOString() : undefined,
    to: date ? endOfDay(date).toISOString() : undefined,
  };
}

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function inputClass() {
  return "rounded-2xl border border-[#cabda4] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f251a] outline-none";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const current = key(value);
    if (seen.has(current)) {
      return false;
    }
    seen.add(current);
    return true;
  });
}

function parseMonth(value: string) {
  const [year, month] = value.split("-").map((part) => Number(part));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }
  return new Date(year, month - 1, 1);
}

function calendarCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells: Array<Date | null> = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function calendarHref(filters: NormalizedFilters, overrides: { month?: Date; selected?: string } = {}) {
  const params = new URLSearchParams();
  for (const key of ["category", "role", "status", "providerId", "date"] as const) {
    if (filters[key] && filters[key] !== "all") {
      params.set(key, filters[key]);
    }
  }
  params.set("month", overrides.month ? monthValue(overrides.month) : filters.month);
  if (overrides.selected ?? filters.selected) {
    params.set("selected", overrides.selected ?? filters.selected);
  }
  return `/live/calendar?${params.toString()}`;
}

function monthValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function startOfDay(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: string) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameMonth(value: Date, month: Date) {
  return value.getFullYear() === month.getFullYear() && value.getMonth() === month.getMonth();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
