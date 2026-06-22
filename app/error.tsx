"use client";

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-12 text-[#1e2419]">
      <section className="mx-auto max-w-2xl rounded-3xl border border-[#d9b2a3] bg-[#fff3ed] p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[.14em] text-[#8c3f2b]">Application error</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">Something went wrong.</h1>
        <p className="mt-4 text-sm leading-6 text-[#675f50]">
          Retry the page. If it keeps failing, check the local development logs.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-6 rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
