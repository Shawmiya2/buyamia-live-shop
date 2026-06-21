"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  canAccessDashboard,
  getDashboardAccessLabel,
  getDashboardForRole,
} from "@/lib/backend/role-guard";
import type { DashboardType, SafeUser } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export function DashboardAccessGate({
  dashboardType,
  children,
}: {
  dashboardType: DashboardType;
  children: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiEnvelope<{ user: SafeUser }>) => {
        setUser(payload.success ? payload.data.user : null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50]">
          Checking session...
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d9b2a3] bg-[#fff3ed] p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#8c3f2b]">Authentication required</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-[#1e2419]">Login to access this dashboard.</h1>
          <Link href="/login" className="mt-5 inline-flex rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">Login</Link>
        </div>
      </section>
    );
  }

  if (!canAccessDashboard(user.role, dashboardType)) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d9b2a3] bg-[#fff3ed] p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#8c3f2b]">Access denied</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-[#1e2419]">{getDashboardDeniedMessage(dashboardType)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#675f50]">
            Current account: {user.name} as {user.role.replace(/_/g, " ")}.
          </p>
          <Link href={getDashboardForRole(user.role)} className="mt-5 inline-flex rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0]">
            Go to your dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50] sm:flex-row sm:items-center sm:justify-between">
          <span>{user.name} - {user.role.replace(/_/g, " ")}</span>
          <button type="button" onClick={logout} className="w-fit rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
            Logout
          </button>
        </div>
      </section>
      {children}
    </>
  );
}

function getDashboardDeniedMessage(dashboardType: DashboardType) {
  if (dashboardType === "main") {
    return "This dashboard is reserved for main administrators.";
  }

  return `This dashboard is for ${getDashboardAccessLabel(dashboardType)} partners.`;
}
