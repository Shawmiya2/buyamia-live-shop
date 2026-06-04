"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  AccountCreationResponse,
  DemoSession,
  ProfileType,
} from "@/lib/backend/types";
import {
  clearDemoSession,
  createDemoSession,
  createDemoSessionForRole,
  readDemoSession,
  saveDemoSession,
} from "@/lib/demo-session";

const roles: {
  label: string;
  profileType: ProfileType;
  detail: string;
  dashboard: string;
}[] = [
  {
    label: "Hotel",
    profileType: "hotel",
    detail: "Manage room lives, verification, bookings, and replay windows.",
    dashboard: "/dashboard/hotel",
  },
  {
    label: "Restaurant",
    profileType: "restaurant",
    detail: "Run chef streams, reservations, menu highlights, and diner trust.",
    dashboard: "/dashboard/restaurant",
  },
  {
    label: "Supplier",
    profileType: "supplier",
    detail: "Show sourcing lives, RFQs, verification, and buyer analytics.",
    dashboard: "/dashboard/supplier",
  },
  {
    label: "Service Provider",
    profileType: "service_provider",
    detail: "Set up service lives with mock verification, pins, and replay controls.",
    dashboard: "/dashboard/services",
  },
  {
    label: "Viewer",
    profileType: "viewer",
    detail: "Follow providers, view upcoming lives, and watch available replays.",
    dashboard: "/dashboard/viewer",
  },
];

const demoRoles: { label: string; profileType: ProfileType }[] = [
  { label: "Main admin", profileType: "main_admin" },
  { label: "Hotel", profileType: "hotel" },
  { label: "Restaurant", profileType: "restaurant" },
  { label: "Supplier", profileType: "supplier" },
  { label: "Service provider", profileType: "service_provider" },
  { label: "Viewer", profileType: "viewer" },
];

export default function SignupPage() {
  const [profileType, setProfileType] = useState<ProfileType>("hotel");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdAccount, setCreatedAccount] =
    useState<AccountCreationResponse | null>(null);
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);

  const selectedRole = useMemo(
    () => roles.find((role) => role.profileType === profileType) ?? roles[0],
    [profileType],
  );

  useEffect(() => {
    setDemoSession(readDemoSession());
  }, []);

  function handleDemoRoleSwitch(nextProfileType: ProfileType) {
    const nextSession = createDemoSessionForRole(nextProfileType);
    saveDemoSession(nextSession);
    setDemoSession(nextSession);
  }

  function handleDemoReset() {
    clearDemoSession();
    setDemoSession(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileType,
          name,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error("Account creation failed.");
      }

      const payload = (await response.json()) as AccountCreationResponse;
      const nextSession = createDemoSession(payload);
      saveDemoSession(nextSession);
      setDemoSession(nextSession);
      setCreatedAccount(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the mock account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-bold text-[#596540]">
            Buyamia
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/hotel"
              className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold"
            >
              Hotel dashboard
            </Link>
            <Link
              href="/dashboard/viewer"
              className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]"
            >
              Viewer account
            </Link>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[.95fr_1.05fr]">
          <div className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-8">
            <p className="text-sm font-semibold text-[#cbd8a7]">
              Create account
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Choose how you want to use Buyamia.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#ded8ca]">
              This mock flow creates a clean account response and sends each role
              to its dashboard. It does not store real identity documents,
              process payments, or add real API keys.
            </p>

            {createdAccount ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.08] p-5">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                  Account ready
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {formatStatus(createdAccount.profileType)} dashboard assigned
                </h2>
                <div className="mt-4 grid gap-2 text-sm text-[#ded8ca]">
                  <p>User ID: {createdAccount.userId}</p>
                  <p>Verification: {formatStatus(createdAccount.verificationStatus)}</p>
                  <p>Onboarding: {formatStatus(createdAccount.onboardingStatus)}</p>
                  <p>Dashboard URL: {createdAccount.dashboardUrl}</p>
                </div>
                <Link
                  href={createdAccount.dashboardUrl}
                  className="mt-5 inline-flex rounded-full bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#1e2419] transition hover:bg-white"
                >
                  Go to dashboard
                </Link>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl bg-[#fffaf0]/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                  Selected role
                </p>
                <p className="mt-2 text-2xl font-semibold">{selectedRole.label}</p>
                <p className="mt-2 text-sm leading-6 text-[#ded8ca]">
                  {selectedRole.detail}
                </p>
                <p className="mt-3 text-sm font-bold text-[#cbd8a7]">
                  Sends to {selectedRole.dashboard}
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm sm:p-6"
          >
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">Profile type</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight">
                Select your account mode
              </h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <button
                  key={role.profileType}
                  type="button"
                  onClick={() => setProfileType(role.profileType)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    profileType === role.profileType
                      ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]"
                      : "border-[#d6cbb6] bg-[#f3ecdc] hover:bg-[#efe5d2]"
                  }`}
                >
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      profileType === role.profileType
                        ? "bg-[#cbd8a7] text-[#1e2419]"
                        : "bg-[#edf2dd] text-[#596540]"
                    }`}
                  >
                    {role.label}
                  </span>
                  <p
                    className={`mt-4 text-sm leading-6 ${
                      profileType === role.profileType
                        ? "text-[#ded8ca]"
                        : "text-[#675f50]"
                    }`}
                  >
                    {role.detail}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#596540]">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Example: Sanur Hotel Partner"
                  className="rounded-2xl border border-[#cabda4] bg-[#f3ecdc] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none focus:border-[#6f7f4f]"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#596540]">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="partner@example.test"
                  className="rounded-2xl border border-[#cabda4] bg-[#f3ecdc] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none focus:border-[#6f7f4f]"
                />
              </label>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl bg-[#fff3ed] p-4 text-sm font-semibold text-[#8c3f2b]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-full bg-[#6f7f4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#596540] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </section>

        <section className="mb-8 rounded-2xl border-2 border-dashed border-[#8c3f2b] bg-[#fff3ed] p-5 text-[#1e2419]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#8c3f2b]">
                Demo only
              </p>
              <h2 className="mt-2 text-xl font-bold">Local role switcher</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675f50]">
                This panel writes a local browser demo session for role guard
                testing. It is not authentication and does not save anything to a
                database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDemoReset}
              className="inline-flex rounded-full border border-[#8c3f2b] px-4 py-2 text-sm font-bold text-[#8c3f2b] transition hover:bg-[#ffe4d9]"
            >
              Clear demo session
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {demoRoles.map((role) => {
              const isActive = demoSession?.profileType === role.profileType;

              return (
                <button
                  key={role.profileType}
                  type="button"
                  onClick={() => handleDemoRoleSwitch(role.profileType)}
                  className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${
                    isActive
                      ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]"
                      : "border-[#d9b2a3] bg-[#fffaf0] text-[#1e2419] hover:bg-[#ffe4d9]"
                  }`}
                >
                  {role.label}
                  <span
                    className={`mt-2 block text-xs font-semibold ${
                      isActive ? "text-[#cbd8a7]" : "text-[#8c3f2b]"
                    }`}
                  >
                    {isActive ? "Current demo session" : "Switch demo role"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-[#d9b2a3] bg-[#fffaf0] p-4">
            {demoSession ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">
                    Active role: {formatStatus(demoSession.profileType)}
                  </p>
                  <p className="mt-1 text-sm text-[#675f50]">
                    Dashboard: {demoSession.dashboardUrl}
                  </p>
                </div>
                <Link
                  href={demoSession.dashboardUrl}
                  className="inline-flex rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#333b2b]"
                >
                  Go to correct dashboard
                </Link>
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#675f50]">
                No demo session is set in this browser.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
