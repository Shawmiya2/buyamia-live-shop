import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { HotelComparison } from "./hotel-comparison";

export const metadata: Metadata = {
  title: "Compare Hotels",
  description: "Compare Buyamia hotel providers, live availability, trust, and booking signals.",
};

export default async function CompareHotelsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "viewer") redirect(user.dashboardUrl);

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard/viewer" className="text-sm font-bold text-[#596540]">Viewer dashboard</Link>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">Hotel discovery</p>
            <h1 className="mt-2 font-serif text-4xl">Compare hotels</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675f50]">
              Select up to four hotel providers and compare their available Buyamia signals side by side.
            </p>
          </div>
          <Link href="/live/catalogue?providerRole=hotel" className="rounded-full bg-[#1e2419] px-5 py-3 text-center text-sm font-bold text-[#fffaf0]">
            Hotel live catalogue
          </Link>
        </header>
        <HotelComparison />
      </div>
    </main>
  );
}
