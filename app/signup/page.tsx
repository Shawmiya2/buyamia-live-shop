"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountCreationResponse, ProfileType } from "@/lib/backend/types";

const roles: { label: string; profileType: Exclude<ProfileType, "main_admin">; detail: string }[] = [
  { label: "Hotel", profileType: "hotel", detail: "Manage room lives, verification, bookings, and replay windows." },
  { label: "Restaurant", profileType: "restaurant", detail: "Run chef streams, reservations, menu highlights, and diner trust." },
  { label: "Supplier", profileType: "supplier", detail: "Show sourcing lives, RFQs, verification, and buyer analytics." },
  { label: "Service Provider", profileType: "service_provider", detail: "Set up service lives with verification metadata and replay controls." },
  { label: "Viewer", profileType: "viewer", detail: "Follow providers, view upcoming lives, and watch available replays." },
];

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Exclude<ProfileType, "main_admin">>("hotel");
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirmation: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdAccount, setCreatedAccount] = useState<AccountCreationResponse | null>(null);
  const selectedRole = useMemo(() => roles.find((item) => item.profileType === role) ?? roles[0], [role]);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const payload = (await response.json()) as ApiEnvelope<AccountCreationResponse>;
      if (!payload.success) {
        throw new Error(payload.error.message);
      }
      setCreatedAccount(payload.data);
      router.push(payload.data.dashboardUrl);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create the account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#d6cbb6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-bold text-[#596540]">Buyamia</Link>
          <Link href="/login" className="rounded-full bg-[#1e2419] px-4 py-2 text-sm font-bold text-[#fffaf0]">Login</Link>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[.95fr_1.05fr]">
          <div className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-8">
            <p className="text-sm font-semibold text-[#cbd8a7]">Create account</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Choose how you want to use Buyamia.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#ded8ca]">
              Accounts are stored in the local database and authenticated with an HttpOnly server session cookie.
            </p>
            <div className="mt-8 rounded-2xl bg-[#fffaf0]/10 p-5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">Selected role</p>
              <p className="mt-2 text-2xl font-semibold">{selectedRole.label}</p>
              <p className="mt-2 text-sm leading-6 text-[#ded8ca]">{selectedRole.detail}</p>
            </div>
            {createdAccount && (
              <p className="mt-5 rounded-2xl bg-white/[.08] p-4 text-sm font-semibold text-[#cbd8a7]">
                Account created. Redirecting to {createdAccount.dashboardUrl}.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-[#6f7f4f]">Profile type</p>
            <h2 className="mt-2 font-serif text-3xl leading-tight">Select your account mode</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roles.map((item) => (
                <button
                  key={item.profileType}
                  type="button"
                  onClick={() => setRole(item.profileType)}
                  className={`rounded-2xl border p-4 text-left transition ${role === item.profileType ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]" : "border-[#d6cbb6] bg-[#f3ecdc] hover:bg-[#efe5d2]"}`}
                >
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${role === item.profileType ? "bg-[#cbd8a7] text-[#1e2419]" : "bg-[#edf2dd] text-[#596540]"}`}>{item.label}</span>
                  <p className={`mt-4 text-sm leading-6 ${role === item.profileType ? "text-[#ded8ca]" : "text-[#675f50]"}`}>{item.detail}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <TextField label="Name" value={form.name} onChange={(value) => updateForm("name", value)} />
              <TextField label="Email" type="email" value={form.email} onChange={(value) => updateForm("email", value)} />
              <TextField label="Password" type="password" value={form.password} onChange={(value) => updateForm("password", value)} />
              <TextField label="Confirm password" type="password" value={form.passwordConfirmation} onChange={(value) => updateForm("passwordConfirmation", value)} />
            </div>

            {error && <p className="mt-4 rounded-2xl bg-[#fff3ed] p-4 text-sm font-semibold text-[#8c3f2b]">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-full bg-[#6f7f4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#596540] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="rounded-2xl border border-[#cabda4] bg-[#f3ecdc] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none focus:border-[#6f7f4f]"
      />
    </label>
  );
}
