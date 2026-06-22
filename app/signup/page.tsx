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
  | { success: false; error: { message: string; fields?: Partial<Record<FormField | "role", string>> } };

type FormField = "name" | "email" | "password" | "passwordConfirmation";
type FieldErrors = Partial<Record<FormField | "role", string>>;

const generalValidationMessage = "Please correct the highlighted fields.";
const fallbackSignupMessage = "We could not create your account. Please try again.";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Exclude<ProfileType, "main_admin">>("hotel");
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirmation: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createdAccount, setCreatedAccount] = useState<AccountCreationResponse | null>(null);
  const selectedRole = useMemo(() => roles.find((item) => item.profileType === role) ?? roles[0], [role]);

  function updateForm(key: FormField, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const rest = { ...current };
      delete rest[key];
      return rest;
    });
  }

  function updateRole(value: Exclude<ProfileType, "main_admin">) {
    setRole(value);
    setFieldErrors((current) => {
      const rest = { ...current };
      delete rest.role;
      return rest;
    });
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!form.password) {
      nextErrors.password = "Please enter a password.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }
    if (form.passwordConfirmation.length < 8) {
      nextErrors.passwordConfirmation = "Please confirm your password.";
    } else if (form.password !== form.passwordConfirmation) {
      nextErrors.passwordConfirmation = "Passwords do not match.";
    }
    if (!role) {
      nextErrors.role = "Please select an account type.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError(generalValidationMessage);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const payload = (await response.json()) as ApiEnvelope<AccountCreationResponse>;
      if (!payload.success) {
        setFieldErrors(payload.error.fields ?? {});
        throw new Error(payload.error.fields ? generalValidationMessage : fallbackSignupMessage);
      }
      setCreatedAccount(payload.data);
      router.push(payload.data.dashboardUrl);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : fallbackSignupMessage);
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

          <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-[#6f7f4f]">Profile type</p>
            <h2 className="mt-2 font-serif text-3xl leading-tight">Select your account mode</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roles.map((item) => (
                <button
                  key={item.profileType}
                  type="button"
                  onClick={() => updateRole(item.profileType)}
                  aria-pressed={role === item.profileType}
                  className={`rounded-2xl border p-4 text-left transition ${role === item.profileType ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]" : "border-[#d6cbb6] bg-[#f3ecdc] hover:bg-[#efe5d2]"}`}
                >
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${role === item.profileType ? "bg-[#cbd8a7] text-[#1e2419]" : "bg-[#edf2dd] text-[#596540]"}`}>{item.label}</span>
                  <p className={`mt-4 text-sm leading-6 ${role === item.profileType ? "text-[#ded8ca]" : "text-[#675f50]"}`}>{item.detail}</p>
                </button>
              ))}
            </div>
            {fieldErrors.role && <p id="signup-role-error" className="mt-2 text-sm font-semibold text-[#8c3f2b]">{fieldErrors.role}</p>}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <TextField name="name" label="Name" value={form.name} error={fieldErrors.name} onChange={(value) => updateForm("name", value)} />
              <TextField name="email" label="Email" type="email" value={form.email} error={fieldErrors.email} onChange={(value) => updateForm("email", value)} />
              <TextField name="password" label="Password" type="password" value={form.password} error={fieldErrors.password} onChange={(value) => updateForm("password", value)} />
              <TextField name="passwordConfirmation" label="Confirm password" type="password" value={form.passwordConfirmation} error={fieldErrors.passwordConfirmation} onChange={(value) => updateForm("passwordConfirmation", value)} />
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

function TextField({ name, label, value, onChange, type = "text", error }: { name: FormField; label: string; value: string; onChange: (value: string) => void; type?: string; error?: string }) {
  const errorId = `signup-${name}-error`;

  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-2xl border bg-[#f3ecdc] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none focus:border-[#6f7f4f] ${error ? "border-[#b85438]" : "border-[#cabda4]"}`}
      />
      {error && <span id={errorId} className="text-sm font-semibold text-[#8c3f2b]">{error}</span>}
    </label>
  );
}
