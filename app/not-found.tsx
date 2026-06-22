import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-12 text-[#1e2419]">
      <section className="mx-auto max-w-2xl rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[.14em] text-[#6f7f4f]">Page not found</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">This Buyamia page is not available.</h1>
        <p className="mt-4 text-sm leading-6 text-[#675f50]">
          The link may be outdated or the resource may no longer be visible.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
            Go home
          </Link>
          <Link href="/live" className="rounded-full border border-[#cabda4] bg-[#f3ecdc] px-5 py-3 text-sm font-bold text-[#1e2419]">
            Explore live streams
          </Link>
        </div>
      </section>
    </main>
  );
}
