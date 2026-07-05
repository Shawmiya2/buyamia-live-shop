import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { getDashboardForRole } from "@/lib/backend/role-guard";
import { RemoteBotConsole } from "./remote-bot-console";

export const metadata: Metadata = {
  title: "Remote Account Bot",
  description: "Use WhatsApp or Telegram as a remote control for your Buyamia account.",
};

export default async function RemoteBotPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f3ecdc] pb-10 text-[#1e2419]">
      <section className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 text-sm font-semibold text-[#675f50] sm:flex-row sm:items-center sm:justify-between">
          <span>{user.name} - {user.role.replace(/_/g, " ")}</span>
          <Link href={getDashboardForRole(user.role)} className="w-fit rounded-full bg-[#1e2419] px-4 py-2 text-xs font-bold text-[#fffaf0]">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#cbd8a7]">Demo remote control</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Remote Account Bot</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#ded8ca]">
            Use WhatsApp or Telegram as a remote control for your Buyamia account.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-[#fffaf0]/12 px-4 py-2 text-xs font-bold text-[#cbd8a7]">
            Provider not configured - local demo mode
          </div>
        </div>
      </section>

      <RemoteBotConsole user={user} />
    </main>
  );
}
