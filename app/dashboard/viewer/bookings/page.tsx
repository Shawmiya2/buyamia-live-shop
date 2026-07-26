import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { ViewerBookingsConsole } from "./viewer-bookings-console";

export const metadata: Metadata = {
  title: "My Bookings",
  description: "Search, filter, sort, and review your Buyamia service bookings.",
};

export default async function ViewerBookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "viewer") redirect(user.dashboardUrl);

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard/viewer" className="text-sm font-bold text-[#596540]">
              Viewer dashboard
            </Link>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
              Viewer bookings
            </p>
            <h1 className="mt-2 font-serif text-4xl">Check booking</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675f50]">
              Review service booking requests and their latest Buyamia status.
            </p>
          </div>
          <Link
            href="/dashboard/viewer/concierge"
            className="rounded-full bg-[#1e2419] px-5 py-3 text-center text-sm font-bold text-[#fffaf0]"
          >
            Buyer concierge
          </Link>
        </header>

        <ViewerBookingsConsole />
      </div>
    </main>
  );
}
