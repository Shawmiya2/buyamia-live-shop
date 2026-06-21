export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-8 text-[#1e2419]">
      <section className="mx-auto max-w-5xl rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
        <p className="text-sm font-bold text-[#596540]">Loading Buyamia...</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-2xl bg-[#f3ecdc]" />
          <div className="h-24 rounded-2xl bg-[#f3ecdc]" />
          <div className="h-24 rounded-2xl bg-[#f3ecdc]" />
        </div>
      </section>
    </main>
  );
}
