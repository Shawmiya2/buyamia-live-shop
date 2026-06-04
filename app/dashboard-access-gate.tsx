"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  canAccessDashboard,
  getDashboardAccessLabel,
  getDashboardForRole,
} from "@/lib/backend/role-guard";
import type { DashboardType, DemoSession } from "@/lib/backend/types";
import { readDemoSession } from "@/lib/demo-session";

export function DashboardAccessGate({
  dashboardType,
  children,
}: {
  dashboardType: DashboardType;
  children: ReactNode;
}) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    setSession(readDemoSession());
    setHasCheckedSession(true);
  }, []);

  if (!hasCheckedSession) {
    return children;
  }

  if (!session) {
    return (
      <>
        <DemoModeNotice />
        {children}
      </>
    );
  }

  if (canAccessDashboard(session.profileType, dashboardType)) {
    return children;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#d9b2a3] bg-[#fff3ed] p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[.14em] text-[#8c3f2b]">
          Demo role guard
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-[#1e2419]">
          {getDashboardDeniedMessage(dashboardType)}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#675f50]">
          Current demo session: {session.name} as{" "}
          {session.profileType.replace(/_/g, " ")}. This is a frontend demo
          guard only, backed by matching API role checks when the demo role is
          sent with requests.
        </p>
        <Link
          href={getDashboardForRole(session.profileType)}
          className="mt-5 inline-flex rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#333b2b]"
        >
          Go to your dashboard
        </Link>
      </div>
    </section>
  );
}

function DemoModeNotice() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 text-sm leading-6 text-[#675f50]">
        Demo mode: no browser demo session was found, so this dashboard remains
        open for testing. Create an account or use the demo-only role switcher
        on signup to test role-specific routing.
      </div>
    </section>
  );
}

function getDashboardDeniedMessage(dashboardType: DashboardType) {
  if (dashboardType === "main") {
    return "This dashboard is reserved for main administrators.";
  }

  return `This dashboard is for ${getDashboardAccessLabel(dashboardType)} partners.`;
}
