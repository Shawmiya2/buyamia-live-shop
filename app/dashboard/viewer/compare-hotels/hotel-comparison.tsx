"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Hotel = {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  category: string;
  description: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  priceRange: string | null;
  availableLiveSessions: number;
  amenities: string[];
  languages: string[];
  trustScore: number;
  bookingAvailability: number;
  featured: boolean;
  popularity: number;
  verified: boolean;
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export function HotelComparison() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsId, setDetailsId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState("all");
  const [rating, setRating] = useState("all");
  const [trust, setTrust] = useState("all");
  const [live, setLive] = useState("all");
  const [amenity, setAmenity] = useState("all");
  const [sort, setSort] = useState("rating");

  async function loadHotels() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/hotels", { cache: "no-store" });
      const payload = (await response.json()) as ApiEnvelope<Hotel[]>;
      if (!payload.success) throw new Error(payload.error.message);
      setHotels(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load hotels.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHotels();
  }, []);

  const countries = unique(hotels.flatMap((hotel) => hotel.country ? [hotel.country] : []));
  const cities = unique(hotels.flatMap((hotel) => hotel.city ? [hotel.city] : []));
  const categories = unique(hotels.map((hotel) => hotel.category));
  const amenities = unique(hotels.flatMap((hotel) => hotel.amenities));

  const visibleHotels = useMemo(() => {
    const query = search.trim().toLowerCase();
    return hotels
      .filter((hotel) =>
        (!query || [hotel.name, hotel.city ?? "", hotel.country ?? ""].some((value) => value.toLowerCase().includes(query))) &&
        (country === "all" || hotel.country === country) &&
        (city === "all" || hotel.city === city) &&
        (category === "all" || hotel.category === category) &&
        (price === "all" || (price === "available" ? hotel.priceRange !== null : hotel.priceRange === null)) &&
        (rating === "all" || (hotel.rating !== null && hotel.rating >= Number(rating))) &&
        (trust === "all" || hotel.trustScore >= Number(trust)) &&
        (live === "all" || (live === "available" ? hotel.availableLiveSessions > 0 : hotel.availableLiveSessions === 0)) &&
        (amenity === "all" || hotel.amenities.includes(amenity)),
      )
      .sort((left, right) => {
        if (sort === "alphabetical") return left.name.localeCompare(right.name);
        if (sort === "price") return priceValue(left.priceRange) - priceValue(right.priceRange);
        if (sort === "trust") return right.trustScore - left.trustScore;
        if (sort === "popular") return right.popularity - left.popularity;
        return (right.rating ?? -1) - (left.rating ?? -1) || right.reviewCount - left.reviewCount;
      });
  }, [amenity, category, city, country, hotels, live, price, rating, search, sort, trust]);

  const selectedHotels = selectedIds.map((id) => hotels.find((hotel) => hotel.id === id)).filter((hotel): hotel is Hotel => Boolean(hotel));
  const details = hotels.find((hotel) => hotel.id === detailsId) ?? null;

  function toggleHotel(id: string) {
    setNotice("");
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) {
        setNotice("You can compare up to four hotels.");
        return current;
      }
      return [...current, id];
    });
  }

  return (
    <>
      <section className="mt-6 rounded-3xl border border-[#d6cbb6] bg-[#e9dfcb] p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hotel, city, or country" className={inputClass()} />
          </Field>
          <Select label="Country" value={country} onChange={setCountry} options={countries} all="All countries" />
          <Select label="City" value={city} onChange={setCity} options={cities} all="All cities" />
          <Select label="Hotel category" value={category} onChange={setCategory} options={categories} all="All categories" />
          <Select label="Price range" value={price} onChange={setPrice} options={["available", "not-listed"]} labels={["Price listed", "Price not listed"]} all="All prices" />
          <Select label="Minimum rating" value={rating} onChange={setRating} options={["4", "3"]} labels={["4+", "3+"]} all="All ratings" />
          <Select label="Minimum trust score" value={trust} onChange={setTrust} options={["90", "75", "50"]} labels={["90+", "75+", "50+"]} all="All trust scores" />
          <Select label="Live sessions" value={live} onChange={setLive} options={["available", "none"]} labels={["Available", "None scheduled"]} all="All live availability" />
          <Select label="Amenity" value={amenity} onChange={setAmenity} options={amenities} all="All amenities" />
          <Select label="Sort" value={sort} onChange={setSort} options={["rating", "price", "trust", "alphabetical", "popular"]} labels={["Highest rated", "Lowest price", "Highest trust score", "Alphabetical", "Most popular"]} />
        </div>
      </section>

      {notice ? <p className="mt-4 rounded-2xl bg-[#fff3ed] p-3 text-sm font-bold text-[#8c3f2b]">{notice}</p> : null}
      {error ? (
        <section className="mt-5 rounded-3xl border border-[#e0b7aa] bg-[#fff3ed] p-5 text-[#8c3f2b]">
          <p className="font-bold">Hotels could not be loaded.</p>
          <p className="mt-2 text-sm">{error}</p>
          <button type="button" onClick={() => void loadHotels()} className="mt-4 rounded-full bg-[#8c3f2b] px-4 py-2 text-sm font-bold text-white">Try again</button>
        </section>
      ) : null}

      <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Hotel catalogue</p>
            <h2 className="mt-1 text-xl font-semibold">{loading ? "Loading hotels" : `${visibleHotels.length} hotels`}</h2>
          </div>
          <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">{selectedIds.length}/4 selected</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading ? [0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-[#f3ecdc]" />) :
            visibleHotels.length ? visibleHotels.map((hotel) => (
              <article key={hotel.id} className={`rounded-2xl p-4 ${selectedIds.includes(hotel.id) ? "bg-[#edf2dd]" : "bg-[#f3ecdc]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{hotel.name}</h3>
                    <p className="mt-1 text-sm text-[#675f50]">{[hotel.city, hotel.country].filter(Boolean).join(", ") || "Location not listed"}</p>
                  </div>
                  {hotel.featured ? <span className="rounded-full bg-[#b85438] px-2 py-1 text-[10px] font-black text-white">Featured</span> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#596540]">
                  <span>Trust {hotel.trustScore}</span><span>·</span><span>{hotel.availableLiveSessions} live</span><span>·</span><span>{hotel.reviewCount} reviews</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggleHotel(hotel.id)} className="rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
                    {selectedIds.includes(hotel.id) ? "Remove" : "Compare"}
                  </button>
                  <button type="button" onClick={() => setDetailsId(hotel.id)} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold">Details</button>
                  {hotel.website ? <a href={hotel.website} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold">Hotel profile</a> : null}
                  <Link href={`/live/catalogue?search=${encodeURIComponent(hotel.name)}&providerRole=hotel`} className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold">Hotel lives</Link>
                </div>
              </article>
            )) : !error ? <p className="rounded-2xl bg-[#f3ecdc] p-4 text-sm font-semibold text-[#675f50]">No hotels match the current filters.</p> : null}
        </div>
      </section>

      {selectedHotels.length ? (
        <section className="mt-5 overflow-x-auto rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Side-by-side comparison</h2>
          <div className="mt-4 grid min-w-[720px] gap-3" style={{ gridTemplateColumns: `repeat(${selectedHotels.length}, minmax(170px, 1fr))` }}>
            {selectedHotels.map((hotel) => <ComparisonCard key={hotel.id} hotel={hotel} onRemove={() => toggleHotel(hotel.id)} />)}
          </div>
        </section>
      ) : null}

      {details ? (
        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#1e2419] p-5 text-[#fffaf0] shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#cbd8a7]">Hotel details</p><h2 className="mt-2 text-2xl font-semibold">{details.name}</h2></div>
            <button type="button" onClick={() => setDetailsId("")} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold">Close</button>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#ded8ca]">{details.description ?? "No hotel description is available yet."}</p>
        </section>
      ) : null}
    </>
  );
}

function ComparisonCard({ hotel, onRemove }: { hotel: Hotel; onRemove: () => void }) {
  const rows = [
    ["Location", [hotel.city, hotel.country].filter(Boolean).join(", ") || "Not listed"],
    ["Category", hotel.category],
    ["Rating", hotel.rating === null ? "Not available" : String(hotel.rating)],
    ["Review count", String(hotel.reviewCount)],
    ["Price range", hotel.priceRange ?? "Not listed"],
    ["Live sessions", String(hotel.availableLiveSessions)],
    ["Amenities", hotel.amenities.join(", ") || "Not listed"],
    ["Languages", hotel.languages.join(", ") || "Not listed"],
    ["Trust score", String(hotel.trustScore)],
    ["Rooms available", hotel.bookingAvailability ? String(hotel.bookingAvailability) : "Not listed"],
    ["Featured", hotel.featured ? "Yes" : "No"],
  ];
  return (
    <article className="rounded-2xl bg-[#f3ecdc] p-4">
      <h3 className="font-bold">{hotel.name}</h3>
      <div className="mt-4 grid gap-2">{rows.map(([label, value]) => <div key={label} className="rounded-xl bg-[#fffaf0] p-3"><p className="text-[10px] font-black uppercase text-[#6f7f4f]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}</div>
      <button type="button" onClick={onRemove} className="mt-4 rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-xs font-bold">Remove</button>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-bold text-[#596540]">{label}{children}</label>;
}
function Select({ label, value, onChange, options, labels, all }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: string[]; all?: string }) {
  return <Field label={label}><select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass()}>{all ? <option value="all">{all}</option> : null}{options.map((option, index) => <option key={option} value={option}>{labels?.[index] ?? option}</option>)}</select></Field>;
}
function unique(values: string[]) { return [...new Set(values)].sort(); }
function priceValue(value: string | null) { if (!value) return Number.POSITIVE_INFINITY; const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/); return match ? Number(match[0]) : Number.POSITIVE_INFINITY; }
function inputClass() { return "mt-2 w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-[#1e2419]"; }
