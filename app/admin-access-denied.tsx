import Link from "next/link";
import type { SafeUser } from "@/lib/backend/types";
import { getDashboardForRole } from "@/lib/backend/role-guard";

export function AdminAccessDenied({ user }: { user: SafeUser | null }) {
  return (
    <main className="min-h-dvh bg-[#f3ecdc] text-[#1e2419]">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d9b2a3] bg-[#fff3ed] p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#8c3f2b]">Access denied</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-[#1e2419]">
            This page is reserved for main administrators.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#675f50]">
            {user
              ? `Current account: ${user.name} as ${user.role.replace(/_/g, " ")}.`
              : "Login with a main administrator account to access this page."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={user ? getDashboardForRole(user.role) : "/login"}
              className="inline-flex rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]"
            >
              {user ? "Go to your dashboard" : "Login"}
            </Link>
            <Link
              href="/live"
              className="inline-flex rounded-full border border-[#cabda4] bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1e2419]"
            >
              Explore live streams
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
