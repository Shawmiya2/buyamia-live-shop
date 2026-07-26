export default function CompareHotelsLoading() {
  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-32 rounded-3xl bg-[#e9dfcb]" />
        <div className="mt-6 h-48 rounded-3xl bg-[#fffaf0]" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-80 rounded-3xl bg-[#fffaf0]" />)}
        </div>
      </div>
    </main>
  );
}
