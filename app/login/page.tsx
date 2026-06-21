"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountCreationResponse } from "@/lib/backend/types";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as ApiEnvelope<AccountCreationResponse>;
      if (!payload.success) {
        throw new Error(payload.error.message);
      }
      router.push(payload.data.dashboardUrl);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#f3ecdc] px-4 py-6 text-[#1e2419] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between border-b border-[#d6cbb6] pb-5">
          <Link href="/" className="text-sm font-bold text-[#596540]">Buyamia</Link>
          <Link href="/signup" className="rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold">Sign up</Link>
        </header>
        <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#6f7f4f]">Welcome back</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">Login to Buyamia.</h1>
          <div className="mt-6 grid gap-4">
            <TextField label="Email" type="email" value={email} onChange={setEmail} />
            <TextField label="Password" type="password" value={password} onChange={setPassword} />
          </div>
          {error && <p className="mt-4 rounded-2xl bg-[#fff3ed] p-4 text-sm font-semibold text-[#8c3f2b]">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540] disabled:opacity-60">
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#596540]">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required className="rounded-2xl border border-[#cabda4] bg-[#f3ecdc] px-4 py-3 text-sm font-semibold text-[#1e2419] outline-none focus:border-[#6f7f4f]" />
    </label>
  );
}
